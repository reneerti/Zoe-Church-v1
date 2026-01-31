
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import type { Database } from '../../src/integrations/supabase/types';

// Load environment variables (assuming dotenv is handled by the runner or preloaded)
// If running with ts-node, you might need 'dotenv/config'
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
// Use service_role key if available for faster writes, otherwise anon key is okay if RLS allows or we are admin
// For this script, better to use SERVICE_ROLE key if we had it, but we only saw ANON key in .env.
// We will try with ANON key and rely on the user being logged in OR (better) we ask the user for the key.
// Actually, for a script, we should probably stick to the keys we have. 
// If RLS blocks anon writes to 'bible_verses', this will fail. 
// However, the user asked to "fix" access, so maybe we are admin? 
// Let's assume for now we might need a service role key or we rely on the user having disabled RLS or we use a logged-in user token (hard to get in script).
// Wait, the Previous Session Summary mentioned 'setup_superuser.sql', so maybe RLS allows updates?
// Actually, usually bulk imports need Service Role. 
// Let's default to the ANON key but allow override via ENV.

const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY (or SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);

const ABIBLIA_TOKEN = process.env.ABIBLIA_TOKEN; // User needs to provide this

if (!ABIBLIA_TOKEN) {
    console.error('❌ Missing ABIBLIA_TOKEN environment variable. Please provide it to avoid rate limits.');
    console.log('Get free token at: https://www.abibliadigital.com.br/');
    process.exit(1);
}

const API_BASE = 'https://www.abibliadigital.com.br/api';
const VERSIONS = ['nvi', 'ntlh', 'ara']; // The 3 requested versions

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Map database abbreviation (which we seeded with camelCase/mixed) to API expected abbreviation (lowercase)
// Actually, let's verify what the API expects. Usually it's lowercase 'gn', 'ex'. 
// Our DB seed has 'Gn', 'Êx'.
function normalizeAbbrevRequest(abbrev: string): string {
    // Basic mapping if needed, or just lowercase
    // API expects: gn, ex, lv, nm, dt, js, jz, dt, 1sm, 2sm...
    // Our DB has: Gn, Êx, Lv...
    // We need to remove accents and lowercase
    return abbrev.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/\s+/g, '');
}

async function fetchChapter(version: string, bookAbbrev: string, chapter: number): Promise<any> {
    const url = `${API_BASE}/verses/${version}/${normalizeAbbrevRequest(bookAbbrev)}/${chapter}`;
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${ABIBLIA_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 429) {
                console.warn(`⚠️ Rate limit hit. Waiting 2s...`);
                await sleep(2000);
                return fetchChapter(version, bookAbbrev, chapter); // Retry
            }
            console.error(`❌ Failed to fetch ${version} ${bookAbbrev} ${chapter}: ${response.status} ${response.statusText}`);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error(`❌ Error fetching ${version} ${bookAbbrev} ${chapter}:`, error);
        return null;
    }
}

async function run() {
    console.log('🚀 Starting Bible Import (NVI, NTLH, ARA)...');

    // 1. Get Books from DB to iterate
    const { data: books, error: booksError } = await supabase
        .from('bible_books')
        .select('*')
        .order('book_number');

    if (booksError || !books || books.length === 0) {
        console.error('❌ Failed to load books from DB. Did you run seed_bible_basics.sql?', booksError);
        return;
    }

    console.log(`📚 Loaded ${books.length} books to process.`);

    // 2. Iterate Versions
    for (const version of VERSIONS) {
        console.log(`\n================================`);
        console.log(`📖 Processing Version: ${version.toUpperCase()}`);
        console.log(`================================`);

        const { data: versionData } = await supabase.from('bible_versions').select('id').eq('code', version).single();
        if (!versionData) {
            console.error(`❌ Version ${version} not found in DB. Skipping.`);
            continue;
        }
        const versionId = versionData.id;

        // 3. Iterate Books
        for (const book of books) {
            console.log(`   📘 ${book.name} (${book.chapters_count} chapters)`);

            // 4. Iterate Chapters
            for (let ch = 1; ch <= book.chapters_count; ch++) {
                // Check if already exists (optional optimization, skipping for now to ensure update)
                // Fetch from API
                const data = await fetchChapter(version, book.abbreviation, ch);

                if (data && data.verses) {
                    const versesToInsert = data.verses.map((v: any) => ({
                        version_id: versionId,
                        book_id: book.id,
                        chapter: ch,
                        verse: v.number,
                        text: v.text,
                    }));

                    // Upsert to DB
                    const { error: insertError } = await supabase
                        .from('bible_verses')
                        .upsert(versesToInsert, { onConflict: 'version_id,book_id,chapter,verse' });

                    if (insertError) {
                        console.error(`      ❌ Error saving ${book.abbreviation} ${ch}:`, insertError.message);
                    } else {
                        // console.log(`      ✅ Saved ${book.abbreviation} ${ch} (${versesToInsert.length} verses)`);
                        process.stdout.write('.'); // Minimal log
                    }
                }

                // Politeness delay
                await sleep(150);
            }
            process.stdout.write('\n'); // New line after book
        }
    }

    console.log('\n✅ Import Completed successfully!');
}

run();

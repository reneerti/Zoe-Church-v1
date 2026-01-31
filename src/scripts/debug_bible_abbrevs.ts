
import fetch from 'node-fetch';

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdHIiOiJTYXQgSmFuIDMxIDIwMjYgMDM6Mjg6MjkgR01UKzAwMDAucmVuZWVydGlAZ21haWwuY29tIiwiaWF0IjoxNzY5ODMwMTA5fQ.cWpY4KvxHT2CHuLv7yNdQi8Saq7Can6wGDEHUkV6Eso";
const BASE = "https://www.abibliadigital.com.br/api";

const testAbbrevs = [
    'gn', 'ex', // Basic
    'job', 'jb', 'jo', // Job vs John ambiguity
    'cl', 'fp', // Colossians, Philippians
    '1sm', '1sa', // 1 Samuel
    'jd', 'jud' // Jude
];

async function test() {
    console.log('Testing abbreviations...');

    // First, try to get the full list again (maybe 500 was temporary)
    const booksResp = await fetch(`${BASE}/books`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    if (booksResp.ok) {
        const books = await booksResp.json();
        console.log('✅ /books endpoint worked! Valid abbreviations:');
        books.forEach((b: any) => console.log(`${b.name}: ${b.abbrev.pt}`));
        return;
    } else {
        console.log(`❌ /books failed with ${booksResp.status}. Testing individual books...`);
    }

    for (const ab of testAbbrevs) {
        const resp = await fetch(`${BASE}/verses/nvi/${ab}/1`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        console.log(`${ab}: ${resp.status}`);
    }
}

test();


import fetch from 'node-fetch';

async function checkBooks() {
    console.log('Fetching books from API...');
    try {
        const response = await fetch('https://www.abibliadigital.com.br/api/books');
        if (!response.ok) {
            console.error('Failed to fetch books', response.status);
            return;
        }
        const books = await response.json();
        console.log('API Valid Abbreviations:');
        books.forEach((b: any) => {
            console.log(`${b.name}: ${b.abbrev.pt}`);
        });
    } catch (e) {
        console.error('Error:', e);
    }
}

checkBooks();

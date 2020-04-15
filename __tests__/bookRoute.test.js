const request = require("supertest");

const app = require("../app");
const db = require("../db");
const Book = require("../models/book");

process.env.NODE_ENV = 'test';


let isbn;

describe("Message Routes Test", function () {

  beforeEach(async function () {
    await db.query("DELETE FROM books");

    const book1 = await db.query(`
      INSERT INTO books (
                        isbn,
                        amazon_url,
                        author,
                        language, 
                        pages,
                        publisher,
                        title, 
                        year
                        )
        VALUES ('0691161518',
                'http://a.co/eobPtX2',
                'Matthew Lane',
                'english',
                264,
                'Princeton University Press',
                'Power-Up: Unlocking the Hidden Mathematics in Video Games',
                2017) 
        RETURNING isbn`);

    isbn = book1.rows[0].isbn;
  })

  /** GET / => {books: [book, ...]}  */

  describe("GET /books/", function () {
    test("can see all books", async function () {
      let response = await request(app)
        .get("/books/");

      expect(response.statusCode).toBe(200);
      expect(response.body.books.length).toEqual(1);
    });
  });

  /** GET /[id]  => {book: book} */

  describe("GET /books/:id", function () {
    test("can see book", async function () {
      let response = await request(app)
        .get(`/books/${isbn}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.book.isbn).toEqual(isbn);
    });
  });

  /** GET /[id]  => {book: book} */

  describe("Don't GET /books/:id if wrong id (isbn)", function () {
    test("can not see book", async function () {
      let response = await request(app)
        .get(`/books/000wrongisbn`);

      expect(response.statusCode).toBe(404);
    });
  });

  /** POST /   bookData => {book: newBook}  */

  describe("POST /books/", function () {
    test("Can post new book", async function () {
      let response = await request(app)
        .post(`/books/`)
        .send({
          isbn: '1234000000',
          amazon_url: 'http://a.co/eobPtX2',
          author: 'Eric Jho',
          language: 'Korean',
          pages: 555,
          publisher: 'University Press',
          title: 'New title 1',
          year: 1945
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.book).toEqual(
        {
          isbn: '1234000000',
          amazon_url: 'http://a.co/eobPtX2',
          author: 'Eric Jho',
          language: 'Korean',
          pages: 555,
          publisher: 'University Press',
          title: 'New title 1',
          year: 1945
        }
      );

      // Check that 2 books exist
      const getBookResponse = await request(app).get('/books/');
      expect(getBookResponse.body.books.length).toEqual(2);
    });
  });

  /** POST /   Incorrect body statement (incorrect value type) */

  describe("POST /books/", function () {
    test("Cannot post new book if validation fails (wrong type)", async function () {
      let response = await request(app)
        .post(`/books/`)
        .send({
          isbn: '1234567000',
          amazon_url: 'http://a.co/eobPtX2',
          author: 'Eric Jho',
          language: 'Korean',
          pages: 555,
          publisher: 'University Press',
          title: 'New title 1',
          year: 'WRONG STRING TYPE'
        });

      expect(response.statusCode).toBe(400);
    });
  });

  /** POST /   Incorrect body statement (missing body keys) */

  describe("POST /books/", function () {
    test("Cannot post new book if validation fails (missing value)", async function () {
      let response = await request(app)
        .post(`/books/`)
        .send({
          isbn: '1234567000',
          amazon_url: 'http://a.co/eobPtX2',
          author: 'Eric Jho',
          language: 'Korean',
          pages: 555,
          publisher: 'University Press',
          title: 'New title 1'
        });

      expect(response.statusCode).toBe(400);
    });
  });

  /** PUT /[isbn]   bookData => {book: updatedBook}  */

  describe("PUT /books/isbn", function () {
    test("Can PUT isbn to existing book", async function () {
      let response = await request(app)
        .put(`/books/${isbn}`)
        .send({
          amazon_url: 'http://a.co/eobPtX2',
          author: 'Max Jung',
          language: 'Korean',
          pages: 555,
          publisher: 'University Press',
          title: 'New title 1',
          year: 1945
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.book.author).toEqual('Max Jung');
    });
  });

  /** PUT /[isbn]   wrong input to ISBN  */

  describe("PUT /books/isbn", function () {
    test("Cannot PUT isbn to existing book (if you pass in isbn)", async function () {
      let response = await request(app)
        .put(`/books/${isbn}`)
        .send({
          isbn: '12344555555',
          amazon_url: 'http://a.co/eobPtX2',
          author: 'Max Jung',
          language: 'Korean',
          pages: 555,
          publisher: 'University Press',
          title: 'New title 1',
          year: 1945
        });

      expect(response.statusCode).toBe(400);
    });
  });

  /** DELETE /[isbn]   => {message: "Book deleted"} */
  describe("DELETE /books/isbn", function () {
    test("Can DELETE existing book", async function () {
      let response = await request(app)
        .delete(`/books/${isbn}`);

      expect(response.statusCode).toBe(200);

      // Check that book no longer exists
      const getBookResponse = await request(app).get('/books/');
      expect(getBookResponse.body.books.length).toEqual(0);
    });
  });

})

afterAll(async function () {
  await db.end();
})

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../../src/models/User');
const Book = require('../../src/models/Book');

// Test data generators
const generateTestUser = (overrides = {}) => ({
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  role: 'user',
  ...overrides
});

const generateTestLibrarian = (overrides = {}) => ({
  name: 'Test Librarian',
  email: 'librarian@example.com',
  password: 'password123',
  role: 'librarian',
  ...overrides
});

const generateTestAdmin = (overrides = {}) => ({
  name: 'Test Admin',
  email: 'admin@example.com',
  password: 'password123',
  role: 'admin',
  ...overrides
});

const generateTestBook = (overrides = {}) => ({
  title: 'Test Book',
  author: 'Test Author',
  description: 'A test book description',
  genre: 'Fiction',
  difficulty: 'beginner',
  estimatedReadingTime: 120,
  pages: 200,
  language: 'pt-BR',
  status: 'active',
  ...overrides
});

// User creation helpers
const createTestUser = async (userData = {}) => {
  const user = new User(generateTestUser(userData));
  user.password = await bcrypt.hash(user.password, 10);
  return await user.save();
};

const createTestLibrarian = async (userData = {}) => {
  const user = new User(generateTestLibrarian(userData));
  user.password = await bcrypt.hash(user.password, 10);
  return await user.save();
};

const createTestAdmin = async (userData = {}) => {
  const user = new User(generateTestAdmin(userData));
  user.password = await bcrypt.hash(user.password, 10);
  return await user.save();
};

// Book creation helper
const createTestBook = async (bookData = {}) => {
  const book = new Book(generateTestBook(bookData));
  return await book.save();
};

// JWT token generation
const generateToken = (userId, role = 'user') => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

// Authentication headers
const getAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`
});

const getUserAuthHeaders = async (userData = {}) => {
  const user = await createTestUser(userData);
  const token = generateToken(user._id, user.role);
  return { headers: getAuthHeaders(token), user };
};

const getLibrarianAuthHeaders = async (userData = {}) => {
  const user = await createTestLibrarian(userData);
  const token = generateToken(user._id, user.role);
  return { headers: getAuthHeaders(token), user };
};

const getAdminAuthHeaders = async (userData = {}) => {
  const user = await createTestAdmin(userData);
  const token = generateToken(user._id, user.role);
  return { headers: getAuthHeaders(token), user };
};

// Response validation helpers
const expectValidationError = (response, field) => {
  expect(response.status).toBe(400);
  expect(response.body.errors).toBeDefined();
  if (field) {
    expect(response.body.errors.some(error => error.field === field)).toBe(true);
  }
};

const expectUnauthorized = (response) => {
  expect(response.status).toBe(401);
  expect(response.body.message).toMatch(/unauthorized|token/i);
};

const expectForbidden = (response) => {
  expect(response.status).toBe(403);
  expect(response.body.message).toMatch(/forbidden|permission/i);
};

const expectNotFound = (response) => {
  expect(response.status).toBe(404);
  expect(response.body.message).toMatch(/not found/i);
};

// Database cleanup helpers
const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

const clearUsers = async () => {
  await User.deleteMany({});
};

const clearBooks = async () => {
  await Book.deleteMany({});
};

// Mock data generators
const generateMockReadingSession = (overrides = {}) => ({
  bookId: '507f1f77bcf86cd799439011',
  userId: '507f1f77bcf86cd799439012',
  startTime: new Date(),
  endTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes later
  pagesRead: 10,
  currentPage: 50,
  notes: 'Test reading session',
  ...overrides
});

const generateMockAchievement = (overrides = {}) => ({
  title: 'Test Achievement',
  description: 'A test achievement',
  category: 'reading',
  rarity: 'common',
  xpReward: 100,
  requirements: {
    type: 'books_read',
    target: 1
  },
  ...overrides
});

module.exports = {
  // Data generators
  generateTestUser,
  generateTestLibrarian,
  generateTestAdmin,
  generateTestBook,
  generateMockReadingSession,
  generateMockAchievement,
  
  // Creation helpers
  createTestUser,
  createTestLibrarian,
  createTestAdmin,
  createTestBook,
  
  // Auth helpers
  generateToken,
  getAuthHeaders,
  getUserAuthHeaders,
  getLibrarianAuthHeaders,
  getAdminAuthHeaders,
  
  // Validation helpers
  expectValidationError,
  expectUnauthorized,
  expectForbidden,
  expectNotFound,
  
  // Cleanup helpers
  clearDatabase,
  clearUsers,
  clearBooks
};
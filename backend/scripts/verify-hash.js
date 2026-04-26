const bcrypt = require('bcryptjs');
const password = 'Admin@1234';
const hash = '$2a$10$7Mt1hH3HJm5AVAUuPIst6e2YRfe6rFGIwNvTAjQXlH6XeldFU.V0.';
const valid = bcrypt.compareSync(password, hash);
console.log('Password is valid:', valid);

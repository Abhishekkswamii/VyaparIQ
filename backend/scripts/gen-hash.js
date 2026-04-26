const bcrypt = require('bcryptjs');
const password = 'Admin@1234';
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);
console.log(hash);

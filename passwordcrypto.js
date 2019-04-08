const crypto = require('crypto')

function hashPassword(tpassword){
    //random string
    const len = 16;
    const salt = crypto.randomBytes(len/2).toString('hex');

    //has algorithm
    const hash = crypto.createHmac('sha512', salt);
    hash.update(tpassword);
    const hashed = hash.digest('hex');
    return {salt, hashed};
}

function verifyPassword(tpassword, user){
    const hash = crypto.createHmac('sha512', user.password.salt);
    hash.update(tpassword);
    const tpasswordHashed = hash.digest('hex');
    return tpasswordHashed == user.password.hashed;
}

module.exports = {hashPassword, verifyPassword}
// const p1 = 'password';
// const hp1 = hashPassword(p1);
// console.log(hp1);

// const salt = 'b72e8fdb9668ee64'
// const hashed = '3c7b8240409d959650d55051df0943ab6aad752303d22bf5ffca4a16220113c3f6f00ad492d11f11bcf04abbec6cb0cb5f848ca71467169da10fd2d7009c0b46'
// const user = {password: {salt, hashed}}
// console.log(verifyPassword('password', user))
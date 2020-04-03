const fs = require('fs');

filePath = 'data.json';

module.exports.getUsers = function() {
    let rawdata = fs.readFileSync(filePath);
    return JSON.parse(rawdata).users;
};

module.exports.saveUsersToFile = function(users) {
    const array = { users };
    const data = JSON.stringify(array);
    fs.writeFile(filePath, data, 'utf8', function (err) {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
        console.log("JSON file has been saved.");
    });
}

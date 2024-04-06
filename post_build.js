const fs = require('fs');
const fspromise = require('fs/promises');
const path = require('path');

const directoryPath = path.join(__dirname, 'build');

function addJsExtension(filePath) {
    fs.readFile(filePath, 'utf8', function(err, data) {
        if (err) {
            console.error('Error reading file:', filePath, err);
            return;
        }
        // Match relative and package imports without .js at the end
        const regex = /from\s+['"]([^'"]+)(?<!\.js)['"]/g;
        const modifiedData = data.replace(regex, (match, p1) => `from '${p1}.js'`);
        fs.writeFile(filePath, modifiedData, 'utf8', function(err) {
            if (err) console.error('Error writing file:', filePath, err);
        });
    });
}

function readDirectory(directory) {
    fs.readdir(directory, function(err, files) {
        if (err) {
            console.error('Error reading directory:', directory, err);
            return;
        }
        files.forEach(function(file) {
            const fullPath = path.join(directory, file);
            fs.stat(fullPath, function(err, stat) {
                if (err) {
                    console.error('Error stating file:', fullPath, err);
                    return;
                }
                if (stat.isDirectory()) {
                    readDirectory(fullPath);
                } else if (file.endsWith('.js')) {
                    addJsExtension(fullPath);
                }
            });
        });
    });
}

async function copyFile(sourceFilePath, destinationFolderPath) {
    try {
        const fileName = path.basename(sourceFilePath);
        const destinationFilePath = path.join(destinationFolderPath, fileName);
        await fspromise.copyFile(sourceFilePath, destinationFilePath);
        console.log(`File was copied to ${destinationFilePath}`);
    } catch (error) {
        console.error('Error copying file:', error);
    }
}

readDirectory(directoryPath);
copyFile('./node_modules/gl-matrix/gl-matrix-min.js', './build/')

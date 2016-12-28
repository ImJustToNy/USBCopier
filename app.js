/*
*   Name:     USB Coppier 
*   Made by:  Antoni Siek [imtony@protonmail.com]
*   Version:  1.0
*/

var whereToSave = '/Volumes/STORAGE/USBCopierDest/',
    whereToLook = '/DCIM/100MSDCF/';

var usb       = require('usb'),
    drivelist = require('drivelist'),
    fs        = require('fs'),
    ExifImage = require('exif').ExifImage;

function s() {
    for (var i = 0; i < arguments.length; i++) {
        console.log(arguments[i]);
    }
}

usb.on('attach', function(device) {
    var found = false;

    s('New device connected');

    s('Looking for new devices...')

    setTimeout(function() {
        drivelist.list((error, drives) => {
            if (error) {
                throw error;
            }

            for (var i = drives.length - 1; i >= 0; i--) {
                if(!drives[i].system && drives[i].size > 1000000000) {
                    newDiskFound(drives[i]);
                    found = true;
                    break;
                }
            }

            if(!found) {
                s('No new device found!');
            }
        });
    }, 3000);
});

function newDiskFound(disk) {
    s('Found new device -> ' + disk.description);
    s('Capacity: ' + formatBytes(disk.size));
    s('Mount point: ' + disk['mountpoints'][0].path);

    var imagesPath = disk['mountpoints'][0].path + whereToLook;

    if(!fs.existsSync(imagesPath)) {
        s('Source directory not found');
        return;
    }

    if (!fs.existsSync(whereToSave)) {
        s('Target directory not found');
        return;
    }

    var remoteImages = fs.readdirSync(imagesPath) || [];

    var localImages = fs.readdirSync(whereToSave) || [];

    var diff = arr_diff(localImages, remoteImages);

    s('Found ' + diff.length + ' files to copy');

    if(diff.length > 0) {

        var pace = require('pace')(diff.length);
         
        diff.forEach(file => {

            fs.createReadStream(imagesPath + file).pipe(fs.createWriteStream(whereToSave + file));
            pace.op();

        });

        s('Copying finished');

    }
}

/*  Stackoverflow below :)  */

function formatBytes(bytes,decimals) {
   if(bytes == 0) return '0 Byte';
   var k = 1000;
   var dm = decimals + 1 || 3;
   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
   var i = Math.floor(Math.log(bytes) / Math.log(k));
   return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function arr_diff (a1, a2) {

    var a = [], diff = [];

    for (var i = 0; i < a1.length; i++) {
        a[a1[i]] = true;
    }

    for (var i = 0; i < a2.length; i++) {
        if (a[a2[i]]) {
            delete a[a2[i]];
        } else {
            a[a2[i]] = true;
        }
    }

    for (var k in a) {
        diff.push(k);
    }

    return diff;
};
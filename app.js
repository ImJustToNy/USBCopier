/*
*   Name:     USB Coppier 
*   Made by:  Antoni Siek [imtony@protonmail.com]
*   Version:  1.0
*/

var whereToSave = '/Volumes/STORAGE/USBCopierDest/';

var usb       = require('usb'),
    drivelist = require('drivelist'),
    fs        = require('fs'),
    ExifImage = require('exif').ExifImage;

// usb.setDebugLevel(4);

function s() {
    for (var i = 0; i < arguments.length; i++) {
        console.log(arguments[i]);
    }
}

usb.on('attach', function(device) {
    var found = false;

    s('Podłączono urządzenie!');

    s('Wyszukiwanie nowych urządzeń...')

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
                s('Nie odnaleziono żadnych nowych urządzeń!');
            }
        });
    }, 3000);
});

function newDiskFound(disk) {
    s('Znalazłem nowy dysk -> ' + disk.description);
    s('Pojemność: ' + formatBytes(disk.size));
    s('Mount point: ' + disk['mountpoints'][0].path);

    var imagesPath = disk['mountpoints'][0].path + '/DCIM/100MSDCF/';

    if(!fs.existsSync(imagesPath)) {
        s('Nie znaleziono folderu ze zdjęciami');
        return;
    }

    if (!fs.existsSync(whereToSave)) {
        s('Nie znaleziono folderu docelowego');
        return;
    }

    var remoteImages = fs.readdirSync(imagesPath) || [];

    var localImages = fs.readdirSync(whereToSave) || [];

    var diff = arr_diff(localImages, remoteImages);

    s('Znalazłem ' + diff.length + ' plików do skopiowania');

    if(diff.length > 0) {

        var pace = require('pace')(diff.length);
         
        diff.forEach(file => {

            // var date;
            
            // new ExifImage({ image : imagesPath + file }, function (error, exifData) {
            //     if (!error) {
            //         date = exifData.image.ModifyDate.replace(' ', '_');
            // s('Zapisuje w ' + whereToSave + file);

            fs.createReadStream(imagesPath + file).pipe(fs.createWriteStream(whereToSave + file));
            pace.op();

            //     }
            // });
        });

        s('Kopiowanie zakończone');

    }
}

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
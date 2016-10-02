var util = require("util");
var fs = require("fs");
var Horseman = require("node-horseman");

var _min = 18065017;
var _max = 18065017;

ScrapServelOneAtTime();

function ScrapServel1()
{
    var ruts = GenerateRuts(18065017, 18065020);

    var horseman = new Horseman({
        loadImages: false,
        timeout: 10000
    });

    horseman
        .userAgent("Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0")
        .open("https://consulta.servel.cl/");

    ruts.forEach(function(rut)
    {




        horseman.close();
    });
}


function ScrapServelOneAtTime()
{
    var ruts = GenerateRuts(_min, _max);

    var sequence = Promise.resolve();

    ruts.forEach(function (rut)
    {
        sequence = sequence.then(function()
        {
            console.log("Start - " + rut);
            return HorsemanScrap(rut);
        }).then(function()
        {
            if (RemoveDigito(rut) == _max)
                console.log("Scraping Ended");
        });
    });
}

function HorsemanScrap(rut)
{
    var horseman = new Horseman({
        loadImages: false,
        timeout: 10000
    });

    return horseman
        .userAgent("Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0")
        .open("https://consulta.servel.cl/")
        .value("#Nombre", "")
        .value("#RunIn", rut)
        .click("#btnConsulta")
        .waitFor(function(selector)
            {
                return $(selector).text() !== "";
            },
            "#Nombre", true)
        .evaluate(function()
        {
            var informacion = {
                Rut: $("#Run").text(),
                Nombre: $("#Nombre").text(),
                CircunscripcionElectoral: $("#Cirs").text(),
                Comuna: $("#Comuna").text(),
                Provincia: $("#Provincia").text(),
                Region: $("#Region").text(),
                Mesa: $("#Mesa").text(),
                Habilitado: $("#Habilitado").text(),
                LocalVotacion: $("#Local").text(),
                Direccsion: $("#Direccion").text()
            }

            return informacion;
        })
        .then(function(informacion)
        {
            Save(informacion, rut);
        })
        .close()
        .catch(function(err)
        {
            Save(err, "Error_" + rut);
        });
}

function GetDigito(rut)
{
    var suma = 0;
    var mult = 2;

    for (var i = rut.length - 1; i >= 0; i--)
    {
        suma = suma + rut.charAt(i) * mult;

        if (mult === 7)
            mult = 2;
        else
            mult ++;
    }

    var resto = 11 - (suma % 11);

    if (resto === 10)
    {
        return "k";
    }

    if (resto === 11)
        return "0";

    else
        return resto;
}

function RemoveDigito(rut)
{
    return rut.substring(0, rut.length - 1);
}

function Save(obj, name)
{
    var string = util.inspect(obj);

    var path = "Logs/";
    var fileName = name + ".txt";

    fs.writeFile(path + fileName, string, function(err)
    {
        if (err)
        {
            return console.log(err);
        }

        console.log("File created: " + fileName);
    });
}

function GenerateRuts(min, max)
{
    var ruts = [];

    for (var i = min; i <= max; i++)
    {
        var rut = i.toString() + GetDigito(i.toString());

        ruts.push(rut);
    }

    return ruts;
}
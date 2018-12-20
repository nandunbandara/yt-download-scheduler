const app = require('express')();

let fs = require('fs');
const yt = require('youtube-dl');
const schedule = require('node-schedule');

const bodyParser = require('body-parser');

app.use(bodyParser.json());

app.post('/video', (req, res)=>{

    let data = {};

    yt.getInfo(req.body.url, function(err, info) {
        if (err) throw err;
       
        data.id =  info.id;
        data.title =  info.title;
        data.url = info.url;
        data.thumbnail = info.thumbnail;
        data.description =  info.description;
        data.filename = info._filename;
        data.format = info.format_id;

      });
    
    fs.appendFile("./queue.txt", req.body.url+"\n", function(err) {
        if(err) {
            return console.log(err);
        }
    
        res.status(200).json({ success:true, message:"Video added to queue", data: data });

    }); 
    
    
});

app.get('/queue', (req, res) => {

    var queue = fs.readFileSync('./queue.txt', 'utf8');


    console.log(queue);

    res.status(200).json({data: queue.split('\n').filter(value => value !== "")});

});

let startQueue = () => {

    console.log("Scheduling queue...");


    schedule.scheduleJob({hour: 17, minute: 05}, function(){

        console.log("starting queue...");
        
        var queue = fs.readFileSync('./queue.txt', 'utf8');

        queue.split('\n').filter(value => value !== "").forEach(url => {
            downloadVideo(url);
        });

    });

};

let downloadVideo = (url) => {
    let filename = "";
    let video = yt(url);

    video.on('info', function(info) {
        console.log('Download started');
        console.log('filename: ' + info.filename);
        console.log('size: ' + info.size);

        filename = info.filename;
    });
    
    video.pipe(fs.createWriteStream(`./data/${filename+new Date().getTime()}.mp4`));
};

startQueue();

app.listen(6000, err => {
    if(err){
        console.log('Could not start application!');
        return;
    }

    console.log('Application started on port 6000');
});
const puppeteer = require('puppeteer');
const ytdl = require('ytdl-core');
const log = require('log-to-file');


module.exports = {
    
    /**
     * itterates through an array of song search values 
     * goes to the view page for all search results and 
     * gets the top result's title and url and appends to
     * a list containing objects of urls and titles
     *
     * 
     * @param {[String]} video_search_values
     * @returns {[Object]} video_data
     */
    get_video_data: async (video_search_values) => {
    
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();
        let video_data = new Array;
        let other_listing_urls = [];

        // progress variable
        let progress = 0;

        for (let i=0; i < video_search_values.length; i++){
            
            
            await page.goto(video_search_values[i]);
            await page.waitForSelector('#video-title');



            let url = "https://youtube.com" + await page.evaluate(() => 
                document.querySelector('#video-title').getAttribute('href'));

            console.log("url: ", url);

            // let title = await page.evaluate(() => 
            //     document.querySelector('#video-title > yt-formatted-string').textContent);

            other_listing_urls = await page.$$eval(
                '#video-title',
                video_titles => video_titles.map(title => title.getAttribute('href')));

            other_listing_urls = _format_other_listing_urls(other_listing_urls);

            let meta;
            await get_meta_data(url).then(meta_data => meta = meta_data); 

            video_data.push({url, other_listing_urls, meta});

            progress = Math.trunc(((i+1)/video_search_values.length)*100);

        }
        await browser.close();
        return video_data;
    },


    

};





/**
 * @param {String} url_for_video
 * @returns {Promise(meta_data)} meta_data
 */
async function get_meta_data (url_for_video) {

    let stream = ytdl(url_for_video);
    let meta_data = {};
    
    // stream.on('info', info => {
    // return new Promise((response, reject) => {});

    return ytdl.getInfo(url_for_video)
    .then(info => {            
        //log(JSON.stringify(info));
        
        meta_data.title = info.videoDetails.title;
        let thumbnails = info.videoDetails.thumbnail.thumbnails;
        meta_data.img = thumbnails[thumbnails.length-1].url;

        let s = info.videoDetails.lengthSeconds;
        meta_data.lengthMinutes = (s-(s%=60))/60+(9<s?':':':0')+s;

        meta_data.upload_author = info.videoDetails.author.name;

        if(info.videoDetails.media.category === "Music"){
            meta_data.song_title = info.videoDetails.media.song;
            meta_data.artist = info.videoDetails.media.artist;
        }
    })
    .then(() => {return meta_data});
    // .then(() => console.log(meta_data)); 
}


/**
 * @param {[String]} other_listing_urls
 * @returns {[String]} other_listing_urls
 */
function _format_other_listing_urls  (other_listing_urls){

    other_listing_urls = other_listing_urls.filter(function (el) {
        return el != null;
    });
    
    other_listing_urls.shift();
    other_listing_urls = other_listing_urls.slice(0, 5);
    
    
    other_listing_urls = other_listing_urls.map(i => "https://youtube.com" + i); 

    return other_listing_urls;
}
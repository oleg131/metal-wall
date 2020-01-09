/* eslint-disable */

import React, { Fragment, useState, useEffect, useRef } from 'react';
import { BrowserRouter, Switch, Route, Link } from 'react-router-dom';
import { ModalContainer, ModalRoute } from 'react-router-modal';
import Modal from 'react-modal';
import InfiniteScroll from 'react-infinite-scroll-component';
import Img from 'react-image';
import ReactImageFallback from "react-image-fallback";



import 'react-router-modal/css/react-router-modal.css';
import './App.css';

import loadingSvg from './loading.svg'
import moment from 'moment';

const CORST_HOST = 'http://localhost:8080/'


function chunk(data, step) {
  var chunkedData = [];
  for (var i = 0, j = data.length; i < j; i += step) {
    chunkedData.push(data.slice(i, i + step));
  }

  return chunkedData
}

function App() {
  return (
    <div>
      {/* <Header /> */}
      <Main />
    </div>
  );
}

function Main() {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/" component={ Home } />
        {/* <ModalRoute path="/album/:artist/:album" component={ Video } /> */}

        {/* <ModalContainer /> */}
      </Switch>
    </BrowserRouter>
  );
}

Modal.setAppElement('#root');



function Home() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState(null);
  const [start, setStart] = useState(null);
  const [hasMore, sethasMore] = useState(true);
  const [track, setTrack] = useState(null);

  const limit = 200;

  function extractDate(date) {
    var date = new Date(date);
    const format = {
      month: 'long',
      year: 'numeric',
      // day: 'numeric'
    }
    const out = date.toLocaleDateString('en-US', format);


    // var date = moment(date);
    // var out = moment.format('MMMM YYYY')

    return out
  }
  
  function formatItems(items) {
    var items = items.slice();

    const dates = items.map(i => i.date);
    
    var ix = dates.map((value, index) => (value != dates[index - 1]));
    ix = ix.flatMap((bool, index) => bool ? index : []);

    console.log('ix', ix)

    var i, dateAlbum;
    for (i of ix.reverse()) {
      dateAlbum = {
        date: dates[i],
      }
      items.splice(i, 0, dateAlbum)
    }

    items = groupBy(items, 'date', extractDate);

    // console.log(items)

    items = Object.keys(items).map(key => ({
      month: key,
      monthDate: items[key][0]['date'],
      items: chunk(items[key], 7)
    }));

    // Object.keys(items).map(function(key, index) {
    //   items[key] = chunk(items[key], 7) ;
    // });  

    items = items.sort((a, b) => (a.monthDate > b.monthDate));

    console.log('format items', items)

    return items
  }

  useEffect(() => {
    fetchData(start);
  }, [])

  function processData(data) {
    const m = data[2].match('<!-- (.+) -->');
    const date = m[1];

    const el0 = document.createElement('html');
    el0.innerHTML = data[0];
    const artist = el0.getElementsByTagName('a')[0].innerText;

    const el1 = document.createElement('html');
    el1.innerHTML = data[1];
    const album = el1.getElementsByTagName('a')[0].innerText;

    const as = el1.getElementsByTagName('a');
    const url = as[0].getAttribute('href');
    const id = url.split('/').pop();
    const cover = `https://www.metal-archives.com/images/${id[0]}/${id[1]}/${id[2]}/${id[3]}/${id}.`

    return {
      url, id, cover, date, artist, album
    }
  }

  function fetchData(displayStart) {
    const today = moment();

    const month = today.month() + 1;
    const year = today.year();

    const [fromYear, fromMonth, toYear, toMonth] = [year - 1, month, year, month];

    const url = CORST_HOST + `https://www.metal-archives.com/search
    /ajax-advanced/searching/albums/?bandName=&releaseTitle=
    &releaseYearFrom=${fromYear}&releaseMonthFrom=${fromMonth}
    &releaseYearTo=${toYear}&releaseMonthTo=${toMonth}
    &country=&location=&releaseLabelName=&releaseCatalogNumber=&releaseIdentifiers=
    &releaseRecordingInfo=&releaseDescription=&releaseNotes=&genre=&releaseType[]=1
    &sEcho=1&iColumns=3&sColumns=&iDisplayStart=DISPLAYSTART
    &iDisplayLength=200`.replace(/\n/g, '').replace(/ /g, '')

    // console.log('displayStart', displayStart)

    if (!displayStart) {
      console.log('fetch initial')

      fetch(url.replace('DISPLAYSTART', 0))
        .then(res => res.json())
        .then(function(data) {
          fetchData(data.iTotalRecords - 200)
        })
    } else {
      console.log('fetch with start', displayStart)

      fetch(url.replace('DISPLAYSTART', displayStart))
        .then(res => res.json())
        .then(function(data) {
          setStart(displayStart - 200);

          if (data.aaData.length == 0) {
            sethasMore(false);
            return
          }

          data = data.aaData.map(processData);
          data = data.filter(a => a.date <= moment().format("YYYY-MM-DD"));
          data.sort((a, b) => a.date < b.date).reverse();
          setItems(items.concat(data)); 
          console.log('fetched', data.length)
        })
    }

    // console.log(items.length)

    

    // console.log(moment('January 2019'))
    // console.log(total)

    

    
    // fetch(`/api/?offset=${offset}&$limit={limit}`)
    //   .then(res => res.json())
    //   .then(processData)
    //   .then(data => setItems(data));

    // setOffset(offset + limit);

  }

  return (
    <main role="main" className="container-fluid">      
      <InfiniteScroll
        dataLength={ items.length } //This is important field to render the next data
        next={ () => fetchData(start) }
        hasMore={ hasMore }
        loader="Loading"
        endMessage="The end"
      >
        {/* {
          formatItems(items).map(
            (month, monthIndex) => (
              <div className="row" key={monthIndex}>
                <div className="text-white col-2">{ month.month }</div>
                <div className="col-10">
                  {
                    month.items.map((row, rowIndex) => (
                      <div className="row" key={rowIndex}>
                        {
                          row.map((el, elIndex) => 
                          (
                            el.cover ? <Album data={el} key={elIndex} setTrack={setTrack} /> : 
                            <DateAlbum date={moment(el.date)} key={elIndex} />
                          )
                          )
                        }
                        
                      </div>
                    ))
                  }
                </div>

              </div>
            ))
        } */}

          <div className="text-center">
            {
              items.map(
                (item, index) => (
                  // <div className="col-10" key={index}>
                    <Album data={item} key={index} setTrack={setTrack} />
                  // </div>
                )
              )
            }
          </div>




        
      </InfiniteScroll>

      <ModalElement track={track} />
    
    </main>
  );
}

function DateAlbum ({ date }) {
  return (
    <div className="text-center align-middle date-album thumbnail">
      <div className="date-album-inner">
      {date.format('MMMM')} <br />
      {date.format('Do')} <br />
      {date.format('YYYY')}
      </div>
    </div>
  )
}

function Album({ data, setTrack }) {

  const [className, setClassName] = useState("thumbnail zoom");

  function onClick(e) {
    e.preventDefault();
    var track = data.tracks[Math.floor(Math.random() * data.tracks.length)];

    // console.log(track)

    // setQuery(data.artist + ' ' + track.name)
    setTrack({
      artist: data.artist,
      album: data.album,
      name: track.name,
      duration: track.duration
    })
  }
  
  // console.log([data.cover + 'jpg', data.cover + 'jpeg'])

  // <Img 
  //   src={[
  //     data.cover + 'jpg', 
  //     data.cover + 'jpeg'
  //   ]}
  //   style={{width: '100%', height: '100%'}} 
  // />;


  

  return (
    <div className={className}>
      <a 
        href={"https://www.youtube.com/results?search_query=" + data.artist + " " + data.album} 
        target="_blank"
        // href={data.date}
        // onClick={onClick}
      >
    
        <ReactImageFallback
          src={data.cover + 'jpg'}
          fallbackImage={[
            data.cover + 'jpeg', 
            <Empty onLoad={ () => setClassName(className + ' empty-thumbnail') } />
          ]}
          // className={"thumbnail zoom"}
          className="thumbnail-image"
        />
      </a>
    </div>
  )
}

function Empty({ onLoad }) {
  useEffect(() => onLoad())
  return (
    <Fragment />
  )
}

// function YoutubePlaylist({ id }) {
//   return (
//     <div className="container">
//       <iframe width="100%" height="315" 
//         src={"https://www.youtube.com/embed/videoseries?list=" + id}
//         frameborder="0" 
//         allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
//         allowfullscreen>
//       </iframe>
//     </div>
//   )
// }

function ModalElement({ track }) {
  const [modalIsOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState({});

  useEffect(() => {
    if (!!track) {
      openModal();
    }
  }, [track])

  function openModal() {
    setIsOpen(true);
  }

  function afterOpenModal() {
    // references are now sync'd and can be accessed.
    // subtitle.style.color = '#f00';

  }

  function closeModal(){
    setIsOpen(false);
    // setLoadingStatus('Loading');
  }

  if (!track) {
    return null
  } else {
    return (
      <Modal
        isOpen={modalIsOpen}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        // style={{ 
        //   overlay: { 
        //     backgroundColor: 'rgba(0, 0, 0, 0)',
        //     position: 'static',
        //   },
          // content: {
          //   position: 'fixed',
          //   bottom: '0px',
          //   left: '10px',
          //   margin: '0px',
          //   right: '60%',
          //   top: '70%',
          //   // backgroundColor: '#000000',
          //   zIndex: 2,
          //   borderLeft: '0px',
          //   borderBottom: '0px',
          //   borderRight: '0px',
          //   borderTop: '10px solid rgba(7, 49, 54, 0.7)'
          // },
          
        // }}
        shouldCloseOnOverlayClick={false}
        shouldFocusAfterRender={false}
      >
        <p><small>
          {track.artist} - <i>{track.name}</i> from  <span className="bg-light">
            <a href={`https://www.youtube.com/results?search_query=${track.artist} ${track.album}`} 
            target="_blank" className="text-dark">
              {track.album}
            </a>
          </span><br />
          {
            Object.keys(video).length ? `${video.author} / ${video.title}` : ''
          }
        </small></p>

        <div className="row justify-content-center">
          <Video query={`${track.artist} ${track.name}`} loading={loading} setLoading={setLoading}
          setVideo={setVideo} duration={track.duration} />
        </div>
      </Modal>
    )
  }

  
}

function Video({ query, setLoading, loading, setVideo, duration }) {
  const [id, setId] = useState(null);

  const threshold = 10;
  const maxTracks = 2;
 
  function findTrack(tracks, i, duration, signal) {
    console.log('Processing search results, position', i)

    if (i >= tracks.length) {
      console.log('Didnt find track')
      setLoading(1);
      return
    }

    const track = tracks[i];
    fetch('https://invidio.us/api/v1/videos/' + track.videoId, {signal})
      .then(res => res.json())
      .then(data => processTrack(data, duration, tracks, i))
      .catch(e => console.log(e, e.name))
  }

  function processTrack(data, duration, tracks, i) {
    console.log('Processing track', data)

    const length = data.lengthSeconds;
    if (Math.abs(length - duration) < threshold) {
      console.log('Found track', data)
      setId(data.videoId);
      setLoading(false);
      setVideo(data);
      return
    } else {
      findTrack(tracks, i + 1, duration);
    }
  }

  function processResult(data, signal) {
    findTrack(data.slice(0, maxTracks), 0, duration, signal)   
  }

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    setLoading(true)
    setVideo({})

    console.log('Processing query', query)

    fetch('https://invidio.us/api/v1/search?q=' + query, {signal})
      .then(res => res.json())
      .then(data => processResult(data, signal))
      .catch(e => console.log(e, e.name))

    return () => controller.abort()

  }, [query])

  if (!loading) {
    return (
      
        <iframe width="100%" height="100%" 
          src={`https://www.youtube.com/embed/${id}?autoplay=1`} frameBorder="0" 
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen>
        </iframe>
    )
  } else if (loading === 1) {
    return (
      'Not found'
    )
  } else {
    return (
      <img src={loadingSvg} alt="Loading" style={{width: '30%'}} />
    )
  }

  
}

var groupBy = function(xs, key, fn=(i => i)) {
  return xs.reduce(function(rv, x) {
    (rv[fn(x[key])] = rv[fn(x[key])] || []).push(x);
    return rv;
  }, {});
};

function mergeObjects(obj1, obj2) {
  Object.keys(obj1).map(function(key) {
    if (Object.keys(obj2).includes(key)) {
      obj2[key] = obj2[key].concat(obj1[key])
    } else {
      obj2[key] = obj1[key]
    }
  })
  return obj2
}

export default App;

import React, { Fragment, useState, useEffect } from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroll-component';
import ReactImageFallback from "react-image-fallback";
import moment from 'moment';

import './App.css';

const CORST_HOST = 'http://localhost:8080/'


function App() {
  return (
    <div>
      {/* <Header /> */}
      <Main />
    </div>
  );
}

function Header() {
  return (
    <div className="text-center">
      <h2 style={{'font-family': 'Georgia'}}>
        Latest metal releases
      </h2>
    </div>
  )
}

function Main() {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/" component={ Home } />
      </Switch>
    </BrowserRouter>
  );
}

function Home() {
  const [items, setItems] = useState([]);
  const [start, setStart] = useState(null);
  const [hasMore, sethasMore] = useState(true);
  
  useEffect(() => {
    fetchData(start);
  }, [start])

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

          if (data.aaData.length === 0) {
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
  }

  return (
    <main role="main" className="container-fluid text-center">      
      <InfiniteScroll
        dataLength={ items.length } //This is important field to render the next data
        next={ () => fetchData(start) }
        hasMore={ hasMore }
        loader="Loading"
        endMessage="The end"
      >
          <div className="text-center">
            {
              items.map(
                (item, index) => (
                  <Album data={item} key={index} />
                )
              )
            }
          </div>

      </InfiniteScroll>
    </main>
  );
}

function Album({ data }) {

  const [className, setClassName] = useState("thumbnail zoom");
  
  return (
    <div className={className}>
      <a 
        href={"https://www.youtube.com/results?search_query=" + data.artist + " " + data.album} 
        target="_blank" rel="noopener noreferrer">
        <ReactImageFallback
          src={data.cover + 'jpg'}
          fallbackImage={[
            data.cover + 'jpeg', 
            <Empty onLoad={ () => setClassName(className + ' empty-thumbnail') } />
          ]}
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

export default App;

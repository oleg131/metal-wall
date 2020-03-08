import React, { Fragment, useState, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import ReactImageFallback from "react-image-fallback";
import moment from 'moment';

import './App.css';
import placeholderImage from './0.png';

const CORS_HOST = process.env.REACT_APP_CORS_HOST || 'http://localhost:8080/';
const THUMBNAIL_SIZE = 120;

function App() {
  return (
    <div>
      <Header />
      <Home />
    </div>
  );
}

function Header() {
  return (
    <div className="text-center my-5">
      <h2 className="header">
        Wall of latest metal releases. Powered by Metal Archives, YouTube and React.
      </h2>
    </div>
  );
}

function Home() {
  const [items, setItems] = useState([]);
  const [start, setStart] = useState(null);
  const [hasMore, sethasMore] = useState(true);

  const today = moment();
  const month = today.month() + 1;
  const year = today.year();
  const displayLength = 200;
  const [fromYear, fromMonth, toYear, toMonth] = [year - 1, month, year, month];
  const url = CORS_HOST + `https://www.metal-archives.com/search
    /ajax-advanced/searching/albums/?bandName=&releaseTitle=
    &releaseYearFrom=${fromYear}&releaseMonthFrom=${fromMonth}
    &releaseYearTo=${toYear}&releaseMonthTo=${toMonth}
    &country=&location=&releaseLabelName=&releaseCatalogNumber=&releaseIdentifiers=
    &releaseRecordingInfo=&releaseDescription=&releaseNotes=&genre=&releaseType[]=1
    &sEcho=1&iColumns=3&sColumns=&iDisplayStart=DISPLAYSTART
    &iDisplayLength=${displayLength}`.replace(/\n/g, '').replace(/ /g, '');

  const n_col = Math.floor(window.innerWidth / THUMBNAIL_SIZE);
  const n_row = Math.ceil(2 * window.innerHeight / THUMBNAIL_SIZE);
  const n_load = n_col * n_row;

  useEffect(() => {
    console.log('loading init n', n_load);
    fetchInit().then(total => {
      const initItems = [];
      fetchItems(total - displayLength, initItems);
    });
  }, []);

  useEffect(() => {
    console.log('items', items.length);
  }, [items]);

  function fetchItems(displayStart, items) {
    fetchData(displayStart)
      .then(data => {
        items.push(...data);
        if (items.length < n_load) {
          fetchItems(displayStart - displayLength, items);
        } else {
          setItems(items);
          setStart(displayStart - displayLength);
        }
      });
  }

  function fetchInit() {
    console.log('fetch initial');
    return fetch(url.replace('DISPLAYSTART', 0))
      .then(res => res.json())
      .then(function(data) {
        return data.iTotalRecords;
      });
  }

  function fetchData(displayStart) {
    console.log('fetch with start', displayStart);
    return fetch(url.replace('DISPLAYSTART', displayStart))
      .then(res => res.json())
      .then(function(data) {
        if (data.aaData.length === 0) {
          return [];
        }

        data = data.aaData.map(processData).filter(a => !!a);
        data = data.filter(a => a.date <= moment().format("YYYY-MM-DD"));
        data.sort((a, b) => a.date < b.date).reverse();
        console.log('fetched', data.length);

        return data;
      });
  }

  function fetchScroll(displayStart) {
    fetchData(displayStart)
      .then(data => {
        if (!data.length) {
          sethasMore(false);
        } else {
          setItems(items => (
            items.slice().concat(data)//.sort((a, b) => a.date < b.date).reverse()
          ));
          setStart(displayStart - displayLength);
        }
      });
  }

  function processData(data) {
    const m = data[2].match('<!-- (.+) -->');
    if (!m) {
      return null;
    }
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
    const cover = `https://www.metal-archives.com/images/${id[0]}/${id[1]}/${id[2]}/${id[3]}/${id}.`;

    return {
      url, id, cover, date, artist, album
    };
  }

  return (
    <main role="main" className="container-fluid text-center px-0">
      <InfiniteScroll
        dataLength={items.length} //This is important field to render the next data
        next={() => fetchScroll(start)}
        hasMore={hasMore}
        loader="Loading"
        endMessage="The End (These are albums for the past year. Enjoy!)"
        style={{overflow: 'visible'}}
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
  const [className, setClassName] = useState('thumbnail zoom');
  const width = useWindowWidth();

  function useWindowWidth() {
    const [width, setWidth] = useState(document.body.clientWidth);

    useEffect(() => {
      // console.log(document.body.clientWidth);
      // setWidth(document.body.clientWidth);
      
      const handleResize = () => setWidth(document.body.clientWidth);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    });

    return width / (Math.floor(width / THUMBNAIL_SIZE));
  }

  return (
    <div className={className} style={{width: width, height: width}}>
      <a
        href={
          "https://www.youtubelongplays.com/results?search_query="
          + data.artist + " " + data.album
        }
        target="_blank" rel="noopener noreferrer">
        <ReactImageFallback
          initialImage={ placeholderImage }
          src={data.cover + 'jpg'}
          fallbackImage={[
            data.cover + 'jpeg',
            <Empty onLoad={ () => setClassName(className + ' empty') } />
          ]}
          className="thumbnail-image"
        />
      </a>
    </div>
  );
}

function Empty({ onLoad }) {
  useEffect(onLoad);
  return (
    <Fragment />
  );
}

export default App;

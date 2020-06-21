import React from 'react';

export default function Modal({ albumId, setAlbumId }) {
  function onClick() {
    setAlbumId(undefined);
  }

  return (
    <div className={albumId ? "modal active" : "modal"} id="modal-id">
      <a href="#close" className="modal-overlay" aria-label="Close" onClick={onClick}></a>
      <div className="modal-container">
        <div className="modal-body">
          <div className="content">
            <div style={{ maxWidth: '100%' }}>
              <div style={{ position: 'relative', paddingBottom: 'calc(56.25% + 52px)', height: 0 }}>
                <iframe style={{ position: 'absolute', top: 0, left: 0 }} width="100%" height="100%"
                  src={`https://embed.song.link/?url=https://album.link/i/${albumId}&theme=dark`}
                  frameBorder="0" allowFullScreen
                  sandbox="allow-same-origin allow-scripts allow-presentation allow-popups allow-popups-to-escape-sandbox"
                  title={albumId} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

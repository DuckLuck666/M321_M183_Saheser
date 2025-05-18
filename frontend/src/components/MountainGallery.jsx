import './mountainGallery.css';

const MountainGallery = ({ mountains, onMountainSelect, isAuth }) => {
  const handleMountainClick = (mountain) => {
    if (!isAuth) {
      alert('Sie müssen angemeldet sein, um einen Berg zu bearbeiten.');
      return;
    }
    onMountainSelect(mountain);
  };
  return (
    <div className="mountain-grid">
      {mountains.map((mountain) => (
        <div
          key={mountain.id}
          className="mountain-card"
          onClick={() => handleMountainClick(mountain)}
        >
          <h2 className="mountain-title">{mountain.name}</h2>
          <img
            src={mountain.img}
            alt={mountain.name}
            className="mountain-image"
          />

          <p className="mountain-elevation">{mountain.elevation} m.ü.M</p>
          <p className="mountain-elevation">{mountain.longitude} Längengrad</p>
          <p className="mountain-elevation">{mountain.latitude} Breitengrad</p>
          <p className="mountain-elevation">
            Hat es eine Bergbahn? {mountain.hasmountainrailway ? 'Ja' : 'Nein'}
          </p>
        </div>
      ))}
    </div>
  );
};

export default MountainGallery;

import React, { useEffect, useState } from 'react';
import mountainService from '../services/mountainService';
import authenticationService from '../services/authenticationService'; 

const Statistic = ({ elevationLevel }) => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        let token = authenticationService.getToken();
        const data = await mountainService.getStatistics(elevationLevel, token);

        setStatistics(data);
      } catch (err) {
        setError('Fehler beim Laden der Statistiken.');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [elevationLevel]);

  if (loading) return <div>Lade Statistiken...</div>;
  if (error) return <div>{error}</div>;
  const stats = statistics?.statistics || statistics; 
  if (!stats) {
    return <div>Keine Statistiken verfügbar</div>;
  }

  return (
    <div>
      <h2>Statistiken</h2>
      <p>
        Höchster Berg: {stats.highestMountain?.name || 'N/A'} mit{' '}
        {stats.highestMountain?.elevation || 'N/A'} m
      </p>
      <p>
        Anzahl der Berge über {elevationLevel} m:{' '}
        {stats.countAboveThreshold ?? 'N/A'}
      </p>
      <p>
        Nächster Berg zum Nordpol: {stats.closestToNorthPole?.name || 'N/A'}{' '}
        (Breitengrad: {stats.closestToNorthPole?.latitude || 'N/A'})
      </p>
    </div>
  );
};

export default Statistic;

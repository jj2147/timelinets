import React, { FC, useState, useEffect, useMemo } from 'react'

import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map,
  Marker,
  Pin,
  useMapsLibrary,
  useMap,
  MapControl,
  ControlPosition,

} from '@vis.gl/react-google-maps';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Button from '@mui/material/Button';

import ControlPanel from './control-panel';
import dayjs, { Dayjs } from 'dayjs';

const apikey = "AIzaSyBcfXNK22UqlsJYmZvLlQOj-X2NZm4nchc"


interface Coord {
  lat: number,
  lng: number
}

function App() {

  interface Markers {
    position: Coord,
    date: Dayjs
  }
  interface Activity {
    startPosition: Coord,
    endPosition: Coord,
    startDate: Dayjs,
    endDate: Dayjs
  }

  const [controlPosition, setControlControlPosition] = useState<ControlPosition>(ControlPosition.LEFT_BOTTOM);

  const [markers, setMarkers] = useState<Markers[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [zoom, setZoom] = useState(4);

  const [datePickerStart, setDatePickerStart] = useState<Dayjs | null>(null);
  const [datePickerEnd, setDatePickerEnd] = useState<Dayjs | null>(null);

  useEffect(() => {
    // If you're using Create React App and the file is in the public folder
    fetch('data.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        let markersArr = [];
        let activitiesArr = [];

        for (let item of data) {
          if (item.hasOwnProperty("visit")) {
            let location = item.visit.topCandidate.placeLocation;
            let locationsplit = location.replace('geo:', '').split(',');
            markersArr.push({
              position: { lat: parseFloat(locationsplit[0]), lng: parseFloat(locationsplit[1]) },
              date: dayjs(item.startTime.slice(0, 10))
            })
          } else if (item.hasOwnProperty("activity")) {
            let start = item.activity.start;
            let startsplit = start.replace('geo:', '').split(',');
            let end = item.activity.end;
            let endsplit = end.replace('geo:', '').split(',');
            activitiesArr.push({
              startPosition: { lat: parseFloat(startsplit[0]), lng: parseFloat(startsplit[1]) },
              endPosition: { lat: parseFloat(endsplit[0]), lng: parseFloat(endsplit[1]) },
              startDate:dayjs(item.startTime.slice(0, 10)),
              endDate: dayjs(item.endTime.slice(0, 10))
            })
          }
        }

        setMarkers(markersArr);
        setActivities(activitiesArr);
      })
      .catch(error => console.error('There has been a problem with your fetch operation:', error));
  }, []);

  const sortDates = () => {
    if(datePickerStart?.isBefore(dayjs('2018-08-08')))
      alert('izbfor');
  }

  return (
    <APIProvider apiKey={apikey}>
      <Map
        mapId={'mapid'}
        style={{ width: '100vw', height: '100vh' }}
        defaultCenter={{ lat: 37.770525, lng: -122.432494 }}
        defaultZoom={5}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
      >
        <MapControl position={ControlPosition.TOP_LEFT}>
          <div
            style={{
              background: 'white',
              padding: '1em',
              opacity: .9
            }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="from"
                value={datePickerStart}
                onChange={(newValue) => setDatePickerStart(newValue)}
              />
              <DatePicker
                label="to"
                value={datePickerEnd}
                onChange={(newValue) => setDatePickerEnd(newValue)}
              />
              <Button variant="outlined" onClick={sortDates}>go</Button>

            </LocalizationProvider>
          </div>
        </MapControl>

        {markers.length ? markers.map((marker) =>
          <AdvancedMarker
            position={marker.position}
            title={'AdvancedMarker with custom html content.'}>
              
            <div
              style={{
                visibility: (datePickerStart && datePickerEnd && datePickerStart.isBefore(marker.date) && marker.date.isBefore(datePickerEnd)) ? "visible" : "hidden",
                // visibility:{true?'visible':'hidden'},
                whiteSpace: 'nowrap',
                width: 16,
                height: 16,
                position: 'absolute',
                top: 0,
                left: 0,
                background: '#1dbe80',
                border: '2px solid #0e6443',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)'
              }}>{marker.date.format('MM-DD-YYYY') }</div>
          </AdvancedMarker>
        ) : <></>}

        {activities.length ? activities.map((a) =>
          <Directions start={a.startPosition} end={a.endPosition} />
        ) : <></>}

      </Map>

      <ControlPanel
        position={controlPosition}
        onControlPositionChange={p => setControlControlPosition(p)}
      />

    </APIProvider>
  )
}

interface DirectionProps {
  start: Coord, end: Coord
}

const Directions: FC<DirectionProps> = ({ start, end }) => {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] =
    useState<google.maps.DirectionsService>();
  const [directionsRenderer, setDirectionsRenderer] =
    useState<google.maps.DirectionsRenderer>();
  const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([]);
  const [routeIndex, setRouteIndex] = useState(0);
  const selected = routes[routeIndex];
  const leg = selected?.legs[0];

  // Initialize directions service and renderer
  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ map }));
  }, [routesLibrary, map]);

  // Use directions service
  useEffect(() => {
    if (!directionsService || !directionsRenderer) return;

    directionsService
      .route({
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
      })
      .then(response => {
        directionsRenderer.setDirections(response);
        setRoutes(response.routes);
      });

    return () => directionsRenderer.setMap(null);
  }, [directionsService, directionsRenderer]);

  // Update direction route
  useEffect(() => {
    if (!directionsRenderer) return;
    directionsRenderer.setRouteIndex(routeIndex);
  }, [routeIndex, directionsRenderer]);

  if (!leg) return null;

  return (
    <div className="directions">
      {/* <h2>{selected.summary}</h2>
      <p>
        {leg.start_address.split(',')[0]} to {leg.end_address.split(',')[0]}
      </p>
      <p>Distance: {leg.distance?.text}</p>
      <p>Duration: {leg.duration?.text}</p>

      <h2>Other Routes</h2>
      <ul>
        {routes.map((route, index) => (
          <li key={route.summary}>
            <button onClick={() => setRouteIndex(index)}>
              {route.summary}
            </button>
          </li>
        ))}
      </ul> */}
    </div>
  );
}



export default App;

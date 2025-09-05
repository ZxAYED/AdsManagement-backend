

import axios from 'axios';

export const getLocationByPostalCode = async (postalCode: string, countryCode = 'au', apiKey: string) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${postalCode},${countryCode}&key=${apiKey}`;
    const response = await axios.get(url);

    const data = response.data;
    const result = data.results?.[0];

    return result?.formatted_address
  } catch (error) {
    console.error('❌ Geocoding API Error:', error);
    return null;
  }
};

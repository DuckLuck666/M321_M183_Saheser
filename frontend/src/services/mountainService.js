import axios from 'axios';

const backendHost = import.meta.env.VITE_BACKEND;

async function loadMountainList() {
  try {
    console.log('start loadMountainList');
    console.log('Cookies:', document.cookie);
    let res = await axios.get(`${backendHost}/mnts`);
    let mntList = res.data;
    console.log('end loadMountainList: ', mntList);
    return mntList;
  } catch (err) {
    console.error('Error loading mountain list:', err);
    throw err; // Propagate the error instead of showing alert
  }
}

async function loadMountain(mntId) {
  try {
    let res = await axios.get(`${backendHost}/mnts/${mntId}`, {
      withCredentials: true,
    });

    let mnt = res.data;
    console.log('loadMountain: ', mnt);
    return mnt;
  } catch (err) {
    console.error('Error loading mountain:', err);
    throw err; // Propagate the error instead of showing alert
  }
}

async function addMountain(mountain) {
  try {
    if (mountain.id > 0) {
      // Call updatePublicMountain if the mountain ID is greater than 0
      const response = await axios.put(
        `${backendHost}/mnts/${mountain.id}`,
        mountain
      );
      return response.data;
    } else {
      // Call addPublicMountain if the mountain ID is not set
      const response = await axios.post(`${backendHost}/mnts`, mountain);
      return response.data;
    }
  } catch (err) {
    if (err.response && err.response.status === 422) {
      // Display the error message from the response
      const errorMessage =
        err.response.data.message || 'Validation error occurred';
      console.error('Validation error:', errorMessage);
      alert(errorMessage); // Display the error message in an alert (or you can show it on the UI)
    } else {
      // Handle other errors
      console.error('Error adding/updating mountain:', err);
      alert('An error occurred while processing your request.');
    }
    throw err; // Propagate the error
  }
}

async function deleteMountain(mntId, token) {
  try {
    await axios.delete(`${backendHost}/mnts/${mntId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    console.error('Error deleting mountain:', err);
    throw err; // Propagate the error
  }
}
async function getStatistics(elevationLevel, token) {
  console.log('that is the token', token);
  try {
    const res = await axios.get(`${backendHost}/statistics/${elevationLevel}`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const { statistics, publicKey, signature } = res.data;

    // Function to convert PEM to ArrayBuffer
    function pemToArrayBuffer(pem) {
      const b64Lines = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
      const b64Decoded = atob(b64Lines);
      const arrayBuffer = new Uint8Array(b64Decoded.length);
      for (let i = 0; i < b64Decoded.length; i++) {
        arrayBuffer[i] = b64Decoded.charCodeAt(i);
      }
      return arrayBuffer.buffer;
    }

    // Convert PEM public key to CryptoKey
    const cryptoKey = await window.crypto.subtle.importKey(
      'spki',
      pemToArrayBuffer(publicKey),
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: { name: 'SHA-256' },
      },
      false,
      ['verify']
    );

    // Encode statistics JSON string to ArrayBuffer
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(statistics));

    // Decode Base64 signature to ArrayBuffer
    const signatureBuffer = pemToArrayBuffer(
      '-----BEGIN SIGNATURE-----\n' + signature + '\n-----END SIGNATURE-----'
    );

    // Verify the signature
    const isValid = await window.crypto.subtle.verify(
      {
        name: 'RSASSA-PKCS1-v1_5',
      },
      cryptoKey,
      signatureBuffer,
      dataBuffer
    );

    console.log('Public Key (PEM):', publicKey);
    console.log('Signature (Base64):', signature);
    console.log('Is signature valid?', isValid);

    return { statistics, publicKey, signature, isValid };
  } catch (err) {
    console.error('Error loading statistics:', err);
    throw err; // Propagate the error
  }
}
export default {
  loadMountainList,
  loadMountain,
  addMountain,
  deleteMountain,
  getStatistics, // Export the new deleteMountain function
};

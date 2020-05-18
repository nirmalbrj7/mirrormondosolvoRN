import axios from 'axios';

const uploadFile = (file, url, callback) => {
  const data = new FormData();
  data.append('file', file);
  data.append('dir', '');
  data.append('name', file.name);
  const url2="https://edatos.drcmp.org/api/fileUpload"
  return axios
    .post(url2, data, {
      headers: {'Content-Type': 'multipart/form-data'},
      onUploadProgress: progressEvent => {
        callback(
          parseInt(
            Math.round((progressEvent.loaded * 100) / progressEvent.total),
            10,
          ),
        );
      },
    })
    .then(response => {
      console.log("===========================================");
      console.log("===========================================");
      console.log("===========================================");
      console.log("IMAGE REQUESTING");
      console.log("===========================================");
      console.log("===========================================");
      console.log("===========================================");
      response.data})
    .catch(response => {
      
      throw response;
    });
};

export default uploadFile;

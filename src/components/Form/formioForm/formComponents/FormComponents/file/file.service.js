import axios from 'axios';

const uploadFile = (file, url, callback) => {
  console.log("====================================================");
  console.log("====================================================");
  console.log("====================================================");
console.log("REQ IMAGES im");
  console.log("====================================================");
  console.log("====================================================");
  console.log("====================================================");
  const data = new FormData();
  data.append('file', file);
  data.append('dir', '');
  data.append('name', file.name);
  console.log("data"+JSON.stringify(data));
  const url2="https://edatos.drcmp.org/api/fileUpload";
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
      
      console.log("IMAGE RESPONSE"+JSON.stringify(response));
     return response.data;
    })
    .catch(response => {
      console.log("IMAGE ERROR RESPONSE"+response);
      throw response;
    });
};

export default uploadFile;
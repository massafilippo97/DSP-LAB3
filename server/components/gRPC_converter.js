const protoLoader = require('@grpc/proto-loader');
const grpcLibrary = require('grpc');
const REMOTE_URL = "localhost:50051";
var fs = require('fs');


let options = {
    keepCase: true, //Preserve field names. The default is to change them to camel case.
    longs: String,  //The type to use to represent long values. Defaults to a Long object type.
    enums: String,  //The type to use to represent enum values. Defaults to the numeric value
    defaults: true, //Set default values on output objects. Defaults to false.
    oneofs: true    //Set virtual oneof properties to the present field's name. Defaults to false.
};
 
let protoFileName = __dirname + '/../conversion.proto';
 
const packageDefinition = protoLoader.loadSync(protoFileName, options);
const packageObject = grpcLibrary.loadPackageDefinition(packageDefinition);
let conversion = packageObject.conversion;
let conversionService = new conversion.Converter(REMOTE_URL, grpcLibrary.credentials.createInsecure());

module.exports.executeConversion = async function executeConversion(originalFileName, originalFormat, newFormat) { 
  return new Promise((resolve, reject) => {
    let connection = conversionService.fileConvert();

    binary = fs.readFileSync('../task_images/'+originalFileName+'.'+originalFormat); 
    
    var wstream = fs.createWriteStream('../task_images/'+originalFileName+'.'+newFormat);

    connection.on('data', function(chunk){ //converted image + resultmetadata, sent as a series of chunks
      if(chunk.meta !== undefined ){
        if(!chunk.meta.success) 
          reject("The conversion attempt has failed!"); 
      }
      else
        wstream.write(chunk.file);
    });

    connection.on('end', function() {  // The java server has finished sending
      wstream.end(); 
      resolve(null);
    });

    connection.on('error', function(e) {
      reject(e);// An error has occurred and the stream has been closed.
    });
     


    connection.write({meta: {file_type_origin: originalFormat, file_type_target: newFormat}});

    reader = fs.createReadStream('../task_images/'+originalFileName+'.'+originalFormat);
    
    reader.on('data', function (chunk) { // Read per chunk and send it to the gRPC service
      connection.write({file: chunk}); 
    });

    reader.on('end', function() {  // The node.js server has finished sending
      connection.end();
    });
  });
}

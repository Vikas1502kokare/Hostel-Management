using my.hostel as my from '../db/schema';


service CatalogService @(odata.version: '2.0') {


  // entity Rooms as projection on my.Rooms;
  // annotate CatalogService.Rooms with {
  //   roomPhotos @Core.MediaType : roomPhotoType;
  // };


  // ✅ NEW Annotation (Nayi Annotation)
entity Rooms as projection on my.Rooms {
  *,
  roomPhotos @(
    Core.MediaType : roomPhotoType,
    Core.ContentDisposition.Type: #inline
  )
};

  entity Price            as projection on my.Price;
  entity Employee         as projection on my.Employee;
  entity Customer         as projection on my.Customer;
  entity Booking          as projection on my.Booking;
  entity Payment          as projection on my.Payment;
  entity CustomerDocument as projection on my.CustomerDocument;
  entity Login            as projection on my.Login;
  entity Transaction      as projection on my.Transaction;


  action uploadImage(
    ID        : UUID,
    imageData : String
  ) returns String;

  function getRoomPhoto(ID : UUID) returns String;

  action getRoomImage(ID : UUID) returns {
    success    : Boolean;
    roomId     : UUID;
    imageSize  : Integer;
    mimeType   : String;
    imageData  : String;
  };

  action deleteAllRooms() returns String;
}

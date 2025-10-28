using my.hostel as my from '../db/schema';

/**
 * CatalogService — exposes hostel data and handles media streaming.
 */
service CatalogService @(odata.version: '2.0') {

  // --------------------------------------------------------------------------
  // Entities
  // --------------------------------------------------------------------------

  entity Rooms as projection on my.Rooms;

  annotate CatalogService.Rooms with {
    roomPhotos @Core.MediaType : roomPhotoType;
  };

  entity Price            as projection on my.Price;
  entity Employee         as projection on my.Employee;
  entity Customer         as projection on my.Customer;
  entity Booking          as projection on my.Booking;
  entity Payment          as projection on my.Payment;
  entity CustomerDocument as projection on my.CustomerDocument;
  entity Login            as projection on my.Login;
  entity Transaction      as projection on my.Transaction;

  // --------------------------------------------------------------------------
  // Custom Actions and Functions
  // --------------------------------------------------------------------------

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

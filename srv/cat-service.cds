using my.hostel as my from '../db/schema';

service CatalogService {

    entity Rooms            as projection on my.Rooms;

    entity Price            as projection on my.Price;
    entity Employee         as projection on my.Employee;
    entity Customer         as projection on my.Customer;
    entity Booking          as projection on my.Booking;
    entity Payment          as projection on my.Payment;
    entity CustomerDocument as projection on my.CustomerDocument;
    entity Login            as projection on my.Login;
    entity Transaction as projection on my.Transaction;
}

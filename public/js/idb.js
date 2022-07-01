
//create a variable to hold db connection
let db;

//establish connection to IndexedDB database called "budget-tracker" and set it to version 1
const request = indexedDB.open('budget-tracker', 1);

// this event will emit if the db version changes (nonexistent to v1, v1 to v2, etc)
request.onupgradeneeded = function(event){
    //save a reference to the db
    const db = event.target.result;
    //create an object store(table) called 'new_transaction', set it to have an auto incrementing primary key of sorts
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

//upon a success
request.onsuccess = function(event){
    //when db is successfully created with is object store (from onupgradeneeded event above) or simply established a connection
    db = event.target.result;
    
    //check if app is online, if yes run uploadTransaction() function to send all local db bata to api
    if(navigator.onLine){
        //coding soon
        uploadTransaction();
    }
};

request.onerror = function(event){
    //log error here
    console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new pizza and there's no internet connection
function saveTransaction(record){
    //open a new transaction with the db and read and write permissions
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //access the object store for 'new_transaction'
    const transactionObjectStore = transaction.objectStore('new_transaction');


    // add a record to your store with add method
    transactionObjectStore.add(record);
};

function uploadTransaction(){
    // open a transaction on your db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //access your object store
    const transactionObjectStore = transaction.objectStore('new_transaction');

    //get all records from store and set to a variable
    const getAll = transactionObjectStore.getAll();

    //upon a successful .getAll() execution, run this function
    getAll.onsuccess = function(){
        // if there was data in indexedDb's store, lets send it to the api server
        if(getAll.result.length > 0){
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers:{
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message){
                    throw new Error(serverResponse);
                }
                // open one more transaction
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                //access new_transaction object store
                const transactionObjectStore = transaction.objectStore('new_transaction');
                //clear all items in your store
                transactionObjectStore.clear();

                alert('All transactions have been submitted!')
            })
            .catch(err =>{
                console.log(err);
            });
        }
    }
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction);

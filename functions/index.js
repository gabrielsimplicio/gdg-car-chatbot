'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const DialogflowApp = require('actions-on-google').DialogflowApp;
admin.initializeApp(functions.config().firebase);
const db = admin.database();

  function getCars(car, year) {
   return db
     .ref(`cars/${car}/${year}`)
     .once('value')
     .then(snapshot => snapshot.val());
}

const carronome = {
    'ford-fiesta' : 'Ford Fiesta',
    'volkswagen-gol' : 'Volkswagen Gol'
}

function searchCarHandler(app) {
  const hasScreen = app.hasSurfaceCapability(
    app.SurfaceCapabilities.SCREEN_OUTPUT
  );

  const car = app.getArgument('car'),
  year = app.getArgument('year');

  console.log('car', car);
  console.log('year', year);

  getCars(car, year).then(cars => {
    console.log(cars);    
      if(!cars.seller) {
          app.tell('No car founded, please try another search parameter');
          return;
      }

  const message = "Foiiiiiii";

  if (hasScreen) {
    // const list = app.buildList('Search result');
    // cars.seller.map((seller, index) => {
    //     return list.addItems(app.buildOptionItem(`/${car}/${year}/seller/${index}`)
    //     .setTitle(`${carronome[car]} ${year} ${seller.name}`)
    //     .setDescription(`${carronome[car]} \n ${seller.price} \n ${year} \n ${seller.name}`)
    //     .setImage(seller.imgs[0], `${seller.name}'s car`))
    // });
    // app.askWithList('Okey, witch car do you like?',list);

    let richMessage = app
      .buildCarousel().addItems(
        cars.seller.map(seller => {
          return app
            .buildOptionItem()
            .setImage(seller.imgs[0], `${seller.name}'s car`)
            .setTitle(`${carronome[car]} ${year} ${seller.name}`)
            .setDescription(`${carronome[car]} \n ${seller.price} \n ${year} \n ${seller.name}`)
            .setKey(`/${car}/${year}/seller/${index}`);
        }));

        app.askWithCarousel('Which types do you like ?', richMessage);
  } else {
    app.tell(message);
  }
});   
}

function optionIntent (app) {
    console.log(app.getSelectedOption());
    
    const hasScreen = app.hasSurfaceCapability(
        app.SurfaceCapabilities.SCREEN_OUTPUT
      );

    if (hasScreen) {
        let richMessage = app
        .buildRichResponse()
        .addSimpleResponse('What to do with the selected car?')
        .addSuggestions(['Buy', 'Call', 'Back']);
    
        app.ask(richMessage);
      } else {
        app.ask('What to do with the selected car? Buy, Call, Back');
      }
  }

exports.googleassistant = functions.https.onRequest((req, res) => {
  const app = new DialogflowApp({ request: req, response: res });

  const actionMap = new Map();
  actionMap.set('search.car', searchCarHandler);
  actionMap.set('selected.car', optionIntent);
  
  app.handleRequest(actionMap);
});
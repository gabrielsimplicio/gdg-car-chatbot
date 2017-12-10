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

  if (hasScreen) {
    let richMessage = app
      .buildCarousel().addItems(
        cars.seller.map((seller, index) => {
            return app
            .buildOptionItem()
            .setImage(seller.imgs[0], `${seller.name}'s car`)
            .setTitle(`${carronome[car]} ${year} ${seller.name}`)
            .setDescription(`${carronome[car]} \n ${seller.price} \n ${year} \n ${seller.name}`)
            .setKey(`/${car}/${year}/seller/${index}`);
        }));

        app.askWithCarousel(app
        .buildRichResponse()
        .addSimpleResponse('Here the search result')
        .addSuggestions(['show more', 'Back']), richMessage);
  } else {
    app.tell(cars.seller.map((seller, index) => { return `${carronome[car]} \n ${seller.price} \n ${year} \n ${seller.name}` }));
  }
});   
}

function optionIntent (app) {    
    const hasScreen = app.hasSurfaceCapability(
        app.SurfaceCapabilities.SCREEN_OUTPUT
      );
      
   db
   .ref(`cars${app.getSelectedOption()}`)
   .once('value')
   .then(snapshot => {
        const seller = snapshot.val();

        console.log('seller', seller);
    
        if (hasScreen) {
            app.ask(app
                .buildRichResponse()
                .addSimpleResponse('The car was selected')
                .addSuggestions(['Buy', 'Call', 'See photos', 'Back']));
        } else {
            app.ask('What to do with the selected car? Buy, Call, Back');
        }
    });    
  }

exports.googleassistant = functions.https.onRequest((req, res) => {
  const app = new DialogflowApp({ request: req, response: res });

  const actionMap = new Map();
  actionMap.set('search.car', searchCarHandler);
  actionMap.set('selected.car', optionIntent);
  
  app.handleRequest(actionMap);
});
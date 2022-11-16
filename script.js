'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const locale = navigator.language;
const dateOptions = { day: `numeric`, month: 'long' };

//
const sideBar = document.querySelector('.sidebar');
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const btnSort = document.querySelector('.sort');
const btnDelete = document.querySelector('.delete');
const modal = document.querySelector('.modal');
const modalBtn = document.querySelector('.modal--button');
const modalTxt = document.querySelector('.modalP');
const overlay = document.querySelector('.overlay');

////////////////////////////
class Workout {
  date = new Date();
  id = (Date.now() + '').split(-10).join('');
  click = 0;
  constructor(coords, distance, duration) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }

  defineDescription() {
    this.description = `${
      this.type === `running` ? '👟️' : '🚲️'
    } ${this.type.replace(
      this.type.at(0),
      this.type.at(0).toUpperCase()
    )} on ${Intl.DateTimeFormat(navigator.locale, {
      day: 'numeric',
      month: 'long',
    }).format(this.date)}`;
  }

  countClick() {
    this.click++;
  }
}

class Running extends Workout {
  type = `running`;

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this.defineDescription();
  }
  calcPace() {
    //h/km
    this.pace = this.duration / this.distance;
    return Number(this.pace);
  }
}
class Cycling extends Workout {
  type = `cycling`;

  constructor(coords, distance, duration, evelationGain) {
    super(coords, distance, duration);
    this.evelationGain = evelationGain;
    this.calcSpeed();
    this.defineDescription();
  }
  calcSpeed() {
    //km/m
    this.speed = this.distance / (this.duration / 60);
    return Number(this.speed);
  }
}

//////
class Application {
  #map;
  #mapEvent;
  #workouts = [];
  #workoutSort = [];
  #markers = [];
  #sortState = false;

  // #date = new Intl.DateTimeFormat(locale, dateOptions).format(new Date());
  // #numID = 1234567890;
  constructor() {
    //get geolocatio
    this._getPosition();
    //load API broswer storage
    this._getStorage();
    //load sort state

    //event listeners
    //change running/cycling
    inputType.addEventListener('change', this._toggleElevationField);
    //submit form
    form.addEventListener('submit', this._newWorkout.bind(this));
    //addMarker
    containerWorkouts.addEventListener(
      'click',
      this._markerPosition.bind(this)
    );
    //btnSorts
    btnSort.addEventListener('click', this._sortWorkouts.bind(this));
    //delete
    btnDelete.addEventListener('click', this.reset);
    //////Dialog Button/////
    modalBtn.addEventListener('click', this._closeModal);
    //////////
  }
  //Geo Location
  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert(`Not able to locate!`);
      }
    );
  }
  //Load map
  _loadMap(position) {
    const { longitude, latitude } = position.coords;
    const cordinates = [latitude, longitude];

    this.#map = L.map('map').setView(cordinates, 13);
    L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    }).addTo(this.#map);

    this.#map.on(`click`, this._showForm.bind(this));
    this.#workouts.forEach(work => this.mapMarker(work));
  }
  //Show form for Workouts
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  //Hide form
  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = `grid`), 1000);
    inputDistance.focus();
  }
  //Toogle Evaltion/steps per minute
  _toggleElevationField(e) {
    e.preventDefault();
    inputCadence.closest('.form__row').classList.toggle(`form__row--hidden`);
    inputElevation.closest('.form__row').classList.toggle(`form__row--hidden`);
  }

  //Workout Implemetation
  _newWorkout(e) {
    e.preventDefault();
    //Helper functions
    //INPUT VALIDATION
    const validInput = (...input) => input.every(inp => Number.isFinite(inp));
    //INPUT POSITIVE NUMBER VALIDATION
    const positiveNum = (...input) => input.every(inp => inp > 0);
    //FIELD BLURING
    const blurFields = (...field) => field.forEach(field => field.blur());

    //VARIABLES
    //COORDINATE
    const { lat, lng } = this.#mapEvent.latlng;
    //INPUT FIELDS
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const cadence = +inputCadence.value;
    const evelation = +inputElevation.value;
    const type = inputType.value;
    let workout;

    /////////////////Running
    if (type === `running`) {
      //Checking for a number and positive number
      if (
        !validInput(distance, duration, cadence) ||
        !positiveNum(distance, duration, cadence)
      ) {
        overlay.classList.add('active');
        modal.classList.add('active');
        //Check for empty field
        if (
          !inputDistance.value ||
          !inputDuration.value ||
          !inputCadence.value
        ) {
          //Bluring fields after popup
          blurFields(inputDistance, inputDuration, inputCadence);
          return (modalTxt.textContent = 'EMPTY FIELD!');
        }
        modalTxt.textContent = 'NOT A NUMBER!';

        blurFields(inputDistance, inputDuration, inputCadence);

        return;
      }
      //Making Running object
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    ////////////////Cycling
    if (type === `cycling`) {
      //Checking for a number and positive number
      if (
        !validInput(distance, duration, evelation) ||
        !positiveNum(distance, duration)
      ) {
        overlay.classList.add('active');
        modal.classList.add('active');
        //Check for empty field
        if (
          !inputDistance.value ||
          !inputDuration.value ||
          !inputElevation.value
        ) {
          //Bluring fields after popup
          blurFields(inputDistance, inputDuration, inputCadence);
          return (modalTxt.textContent = 'EMPTY FIELD');
        }
        modalTxt.textContent = 'NOT A NUMBER!';
        blurFields(inputDistance, inputDuration, inputElevation);

        return;
      }
      //Making Cycling object
      workout = new Cycling([lat, lng], distance, duration, evelation);
    }
    ////////////////

    ////////////////Push workout
    this.#workouts.push(workout);

    ////////////////reverse workout
    this.#workoutSort.push(workout);

    //////////////////

    this.mapMarker(workout);
    /////////////////
    this.insertHtml(workout);
    //////////////
    this._hideForm();
    /////////////
    this._setStorage();
  }

  mapMarker(workout) {
    //MAKING MARKER
    const marker = L.marker(workout.coords, {
      draggable: true,
      riseOnHover: true,
    })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(workout.description)
      .openPopup();
    inputDistance.focus();
    //PUSHING MARKER TO MARKER ARRAY
    this.#markers.push(marker);
  }

  insertHtml(workout) {
    const type = workout.type;
    const html = ` <li class="workout workout--${type}" data-id=${
      workout.id
    }>   
    <div class="workout__details1">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__btns">
    <button class="workout__btn btn__remove">remove</button>
    <button class="workout__btn btn__edit">edit</button>
    <button class="workout__btn btn__save hidden">save</button>
    </div>
    </div>
    <div class="workout__details">
      <span class="workout__icon">${type === 'running' ? '👟️' : '🚲️'}</span>
      <span class="workout__value"><input class="workout__input" value="${
        workout.distance
      }" data-type="distance"></span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value"><input class="workout__input" value="${
        workout.duration
      }" data-type="duration"></span>
      <span class="workout__unit">min</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value span--${type}">${
      type === `running` ? workout.pace.toFixed(1) : workout.speed.toFixed(1)
    }</span>
      <span class="workout__unit">${
        type === `running` ? 'min/km' : 'km/h'
      }</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">${type === `running` ? '👣️' : '⛰'}
      </span>
      <span class="workout__value"><input class="workout__input" value="${
        type === `running` ? workout.cadence : workout.evelationGain
      }" data-type="${type}">
      </span>
      <span class="workout__unit">${type === `running` ? 'spm' : 'm'}
      </span>
    </div>
  </li>`;

    form.insertAdjacentHTML('afterend', html);
  }
  _markerPosition(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    workout.countClick();

    const btnRemove = e.target.classList.contains('btn__remove');
    const distance = workoutEl.querySelector('[data-type="distance"]');
    const duration = workoutEl.querySelector('[data-type="duration"]');

    ////////BUTTON EDIT///////////////
    if (e.target.classList.contains('btn__edit')) {
      e.target.classList.add('hidden');
      e.target.nextElementSibling.classList.remove('hidden');
      distance.focus();
    }
    ////////BUTTON SAVE///////////////
    if (e.target.classList.contains('btn__save')) {
      e.target.classList.add('hidden');
      e.target.previousElementSibling.classList.remove('hidden');
      workout.distance = distance.value;
      workout.duration = duration.value;

      if (workout.type === `running`) {
        workout.cadence = workoutEl.querySelector(
          '[data-type="running"]'
        ).value;

        workout.pace = workout.calcPace();
        workoutEl.querySelector('.span--running').textContent =
          workout.pace.toFixed(1);
      }
      if (workout.type === `cycling`) {
        workout.evelationGain = workoutEl.querySelector(
          '[data-type="cycling"]'
        ).value;
        workout.speed = workout.calcSpeed();
        workoutEl.querySelector('.span--cycling').textContent =
          workout.speed.toFixed(1);
      }
      ////////SETTING STORAGES AFTER EDITING FIELDS//////////////
      //FINDING INDEX OF CHANGED WORKOUT//
      const i = this.#workouts.findIndex(wo => wo === workout);
      const y = this.#workoutSort.findIndex(wo => wo === workout);
      //PUSHING CHANDEG WORKOUT INSTEAD OF OLD WORKOUT///
      this.#workouts[i] = workout;
      this.#workoutSort[y] = workout;
      this._setStorage();
    }
    ////////BUTTON REMOVE///////////////
    if (btnRemove) {
      let index = this.#workouts.findIndex(
        work => work.id === workoutEl.dataset.id
      );

      e.target.closest('.workout').remove();
      this.#map.removeLayer(this.#markers[index]);
      this.#markers.splice(index, 1);
      this.#workouts.splice(index, 1);
      this.#workoutSort.splice(index, 1);
      localStorage.setItem(`workouts`, JSON.stringify(this.#workouts));
      localStorage.setItem(`workoutsSort`, JSON.stringify(this.#workoutSort));
    }
  }

  _setStorage() {
    localStorage.setItem(`workouts`, JSON.stringify(this.#workouts));
    localStorage.setItem(`workoutsSort`, JSON.stringify(this.#workoutSort));
  }
  _getStorage() {
    //Workouts to storages
    const data = JSON.parse(localStorage.getItem('workouts', this.#workouts));
    const data1 = JSON.parse(
      localStorage.getItem('workouts', this.#workoutSort)
    );
    //Helper function
    const prototypeLink = function (data) {
      data.forEach(data => {
        if (data.type === `running`) {
          Object.setPrototypeOf(data, Running.prototype);
        }
        if (data.type === `cycling`) {
          Object.setPrototypeOf(data, Cycling.prototype);
        }
      });
    };

    //Guard clause
    if (!data || !data1) return;

    //Linking workouts to prototypes
    prototypeLink(data);
    prototypeLink(data1);

    //Inserting workouts from storage to UI
    this.#workouts = data;
    this.#workoutSort = data1;
    inputDistance.focus();
    this.#workouts.forEach(work => {
      this.insertHtml(work);
    });
  }

  _sortWorkouts() {
    //sort helper
    const sort = function (work) {
      work.forEach(workout => {
        this.insertHtml(workout);
        this.mapMarker(workout);
      });
    };
    const sortDown = this.#workouts
      .slice()
      .sort((a, b) => b.distance - a.distance);
    //SortState
    this.#sortState = !this.#sortState;
    //sortingArray
    this.#workoutSort.sort((a, b) => a.distance - b.distance);

    //clear workouts from container
    containerWorkouts
      .querySelectorAll('.workout')
      .forEach(workout => workout.remove());
    //clear markers from map
    this.#markers.forEach(marker => marker.remove());
    this.#markers = [];

    //sort by date/default
    if (this.#sortState === false) sort.call(this, this.#workouts);
    //sort by descending
    if (this.#sortState === true) sort.call(this, this.#workoutSort);
  } //sort by ascending
  _closeModal(e) {
    e.preventDefault();
    modal.classList.remove('active');
    overlay.classList.remove('active');
  }
  ////RESETING ALL/////
  reset() {
    localStorage.clear();
    location.reload();
  }
}
//APP STARTING//
const app = new Application();

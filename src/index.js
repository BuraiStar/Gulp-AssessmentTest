class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      jsonResponse: null,
      currentIndex: 0, // Initialize the rotating index to 0
    };
  }

  handleClick = () => {
    // Increment the currentIndex by 1
    this.setState(
      (prevState) => ({
        currentIndex: (prevState.currentIndex + 1) % this.props.lotIDS.length,
      }),
      this.resetRotationInterval
    );
  };

  resetRotationInterval = () => {
    this.stopRotation();
    this.startRotation();
  };

  componentDidMount() {
    this.checkCarParkAvailability();
    this.interval = setInterval(this.checkCarParkAvailability, 60000); // Call every 60 seconds
    this.startRotation();
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.addEventListener("click", this.handleClick);
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    this.stopRotation();

    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.removeEventListener("click", this.handleClick);
    }
  }

  checkCarParkAvailability = () => {
    fetch("https://api.data.gov.sg/v1/transport/carpark-availability", { method: "GET" })
      .then(response => {
        if (!response.ok) {
          throw new Error(response.status);
        }
        return response.json();
      })
      .then(data => {
        console.log(data.items);
        console.log(data.items[0]["carpark_data"]);
        this.setState({ jsonResponse: [data.items[0]["carpark_data"], data.items[0]["timestamp"]]  });
      })
      .catch(error => {
        console.error("Error:", error);
        this.setState({ jsonResponse: [] });
      });
  };

  startRotation() {
    this.rotationInterval = setInterval(() => {
      this.rotateIndex(); // Rotate the index every 10 seconds
    }, 10000);
  }

  stopRotation() {
    clearInterval(this.rotationInterval);
  }

  rotateIndex() {
    const { currentIndex } = this.state;
    const { lotIDS } = this.props;

    // Calculate the next index based on the array length
    const nextIndex = (currentIndex + 1) % lotIDS.length;

    this.setState({ currentIndex: nextIndex });
  }

  render() {
    const { jsonResponse, currentIndex } = this.state;
    const formattedTime = jsonResponse ? convertTime(JSON.stringify(jsonResponse[1])) : null;
    const lotArray = jsonResponse ? convertLotsToArray(jsonResponse[0]) : null;
    const lotSize = ["Small", "Medium", "Big", "Large"]

    return (
      <div>
        <div>
          {jsonResponse ? (
            <div>
              <h1>Car Park Availability</h1>
              <pre style={preStyle}>Last refresh time: {formattedTime}</pre>
              <pre style={preStyle}>You can click on this element to go to the next size</pre>
              <h2>{lotSize[currentIndex]}:</h2>
              <pre style={preStyle}>Highest: {lotArray.lotNumberHolder[currentIndex][1]} Lots available</pre>
              <pre style={preStyle}>Lots: {convertLotsToReadableArray(lotArray.lotIDS[currentIndex][1])}</pre>
              <pre style={preStyle}>Lowest: {lotArray.lotNumberHolder[currentIndex][0]} Lots available</pre>
              <pre style={preStyle}>Lots: {convertLotsToReadableArray(lotArray.lotIDS[currentIndex][0])}</pre>
            </div>
          ) : (
            <h3>Loading available car parks...</h3>
          )}
        </div>
      </div>
    );
  }
}

function convertTime(dateTimeString){
  let tempDateTime = dateTimeString.replace(/['"]+/g, '').split("T");
  let date = tempDateTime[0].split("-");
  let time = tempDateTime[1].split(":");
  let newDate = new Date(date[0],date[1] - 1,date[2], time[0], time[1],time[2].split("+")[0])
  let formattedTime = newDate.toLocaleString("en-US", { timeZone: "Asia/Singapore" });
  return formattedTime
}

function convertLotsToReadableArray(lotArray){
  let string = ""
  for (let i = 0 ; i < lotArray.length; i++){
    string += lotArray[i] + (i < lotArray.length - 1 ? ", " : "");
  }
  return string;
}

const preStyle = {
  maxWidth: '100%',
  overflow: 'hidden',
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word',
};

function convertLotsToArray(jsonDataArray){
  const lotNumberHolder = [[null,null],[null,null],[null,null],[null,null]];
  for (let x in jsonDataArray){
    let carpark_info = jsonDataArray[x]["carpark_info"]
    let carpark_number = jsonDataArray[x]["carpark_number"]
    for (let y in carpark_info){
      let size = checkLotSize(parseInt(carpark_info[y]["total_lots"]));
      let lotsAvailable = parseInt(carpark_info[y]["lots_available"]);
      if (lotNumberHolder[size][0] === null){
        lotNumberHolder[size][0] = lotsAvailable;
        lotNumberHolder[size][1] = lotsAvailable;
        lotIDS[size][0].push(carpark_number);
        lotIDS[size][1].push(carpark_number);
      }else if (lotsAvailable < lotNumberHolder[size][0]){
        lotNumberHolder[size][0] = lotsAvailable;
        lotIDS[size][0] = [];
        lotIDS[size][0].push(carpark_number);
      }else if (lotsAvailable > lotNumberHolder[size][1]){
        lotNumberHolder[size][1] = lotsAvailable;
        lotIDS[size][1] = [];
        lotIDS[size][1].push(carpark_number);
      }else if (lotsAvailable == lotNumberHolder[size][0]){
        lotIDS[size][0].push(carpark_number);
      }else if (lotsAvailable == lotNumberHolder[size][1]){
        lotIDS[size][1].push(carpark_number);
      }
    }
  }
  return {lotIDS: lotIDS, lotNumberHolder: lotNumberHolder};
}



function checkLotSize(lotSize){
  const lotRanges = [["Default", 0],["Small", 100], ["Medium", 300], ["Big", 400], ["Large", Infinity]]
  if (lotSize >= lotRanges[0][1] && lotSize < lotRanges[1][1]){
    return 0;
  }else if (lotSize >= lotRanges[1][1] && lotSize < lotRanges[2][1]){
    return 1;
  }else if (lotSize >= lotRanges[2][1] && lotSize < lotRanges[3][1]){
    return 2;
  }else if (lotSize >= lotRanges[3][1] && lotSize < lotRanges[4][1]){
    return 3;
  }else{
    // Send error Here
    console.error("Outside of range, negative number added")
    return null
  }
}

const lotIDS = [[[], []], [[], []], [[], []], [[], []]]; // Example data for lotIDS

ReactDOM.render(<App lotIDS={lotIDS} />, document.getElementById("root"));

const express = require("express");
const app = express();
const port = 3000;
 
app.get("/", (req, res) => {
  res.send("Hello World!");
});
 
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
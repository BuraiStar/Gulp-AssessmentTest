class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      jsonResponse: null,
    };
  }

  componentDidMount() {
    this.checkCarParkAvailability();
    this.interval = setInterval(this.checkCarParkAvailability, 60000); // Call every 60 seconds
  }

  componentWillUnmount() {
    clearInterval(this.interval);
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
        this.setState({ jsonResponse: [data.items[0]["carpark_data"], data.items[0]["timestamp"]]  });
      })
      .catch(error => {
        console.error("Error:", error);
        this.setState({ jsonResponse: [] });
      });
  };

  render() {
    const { jsonResponse } = this.state;
    const formattedTime = jsonResponse ? convertTime(JSON.stringify(jsonResponse[1])) : null

    return (
      <div>
          <div>
            {jsonResponse ? (
              <div>
                <h1>Car Park Availability</h1>
                <pre>Last refresh time: {formattedTime}</pre>
              </div>
            ) : (
              <h3>Loading avaiable car parks...</h3>
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

  console.log(date)
  console.log(time)
  let newDate = new Date(date[0],date[1] - 1,date[2], time[0], time[1],time[2].split("+")[0])
  let formattedTime = newDate.toLocaleString("en-US", { timeZone: "Asia/Singapore" });
  return formattedTime
}

ReactDOM.render(<App />, document.getElementById("root"));

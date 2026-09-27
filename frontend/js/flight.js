function displayLiveFlights(flights) {

    const container =
        document.getElementById(
            "flightCards"
        );

    const count =
        document.getElementById(
            "flightCount"
        );

    if (!flights ||
        flights.length === 0) {

        container.innerHTML =
            "No flights available.";

        return;
    }

    count.textContent =
        `Monitoring ${flights.length} synthetic flights`;

    container.innerHTML = "";

    flights.forEach(flight => {

        const card =
            document.createElement("div");

        card.className =
            "flight-card";

        card.innerHTML = `

            <h3>
                ✈ ${flight.flight_id}
            </h3>

            <p>
                ${flight.aircraft}
            </p>

            <p>
                ${flight.departure}
                →
                ${flight.destination}
            </p>

            <br>

            <div class="flight-info">

                <div>
                    Latitude<br>
                    <strong>
                        ${flight.latitude}
                    </strong>
                </div>

                <div>
                    Longitude<br>
                    <strong>
                        ${flight.longitude}
                    </strong>
                </div>

                <div>
                    Altitude<br>
                    <strong>
                        ${flight.altitude} ft
                    </strong>
                </div>

                <div>
                    Speed<br>
                    <strong>
                        ${flight.speed} knots
                    </strong>
                </div>

                <div>
                    Heading<br>
                    <strong>
                        ${flight.heading}°
                    </strong>
                </div>

                <div>
                    Fuel<br>
                    <strong>
                        ${flight.fuel}%
                    </strong>
                </div>

                <div>
                    Status<br>
                    <strong>
                        ${flight.status}
                    </strong>
                </div>

                <div>
                    Risk<br>
                    <strong>
                        ${flight.risk}
                    </strong>
                </div>

            </div>

        `;

        container.appendChild(card);

    });
}
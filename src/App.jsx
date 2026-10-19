import React, { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./styles.css";

const GET_DONORS_URL = "http://localhost/hemo-api/get_donors.php";
const CREATE_REQUEST_URL = "http://localhost/hemo-api/create_request.php";
const GET_MATCHING_DONORS_URL = "http://localhost/hemo-api/get_matching_donors.php";


const DEFAULT_LOCATION = {
  lat: 34.0151,
  lng: 71.5249,
  name: "Peshawar",
};

const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

const HOSPITALS = [
  {
    id: 1,
    name: "Lady Reading Hospital",
    lat: 34.0151,
    lng: 71.5249,
  },
  {
    id: 2,
    name: "Khyber Teaching Hospital",
    lat: 34.0139,
    lng: 71.4858,
  },
  {
    id: 3,
    name: "Northwest General Hospital",
    lat: 33.9972,
    lng: 71.4785,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function calculateDistance(lat1, lon1, lat2, lon2) {
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null
  ) {
    return null;
  }

  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function isAvailable(donor) {
  return (
    donor.available === 1 ||
    donor.available === "1" ||
    donor.available === true
  );
}

function getInitials(name = "Donor") {
  return (
    name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "D"
  );
}

/* =========================================================
   LOGO
========================================================= */

function Logo() {
  return (
    <div className="logo">
      <div className="logo-mark">♥</div>

      <div className="logo-text">
        <strong>HEMO</strong>
        <span>Blood Connect</span>
      </div>
    </div>
  );
}

/* =========================================================
   TOP BAR
========================================================= */

function TopBar({ page, setPage }) {
  const navigation = [
    ["home", "Home"],
    ["nearby", "Nearby Donors"],
    ["request", "Request Blood"],
    ["notifications", "Notifications"],
    ["profile", "Profile"],
  ];

  return (
    <header className="topbar">
      <button
        className="brand-button"
        onClick={() => setPage("home")}
        aria-label="Go to home"
      >
        <Logo />
      </button>

      <nav className="desktop-nav">
        {navigation.map(([key, label]) => (
          <button
            key={key}
            className={page === key ? "active" : ""}
            onClick={() => setPage(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="top-actions">
        <span className="role-pill">Patient</span>
        <div className="avatar">S</div>
      </div>
    </header>
  );
}

/* =========================================================
   MAP
========================================================= */

function RecenterMap({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

function MapPreview({
  donors = [],
  userLocation = DEFAULT_LOCATION,
  height = "100%",
}) {
  const center = [userLocation.lat, userLocation.lng];

  return (
    <div className="map-wrapper" style={{ height }}>
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="leaflet-map"
      >
        <RecenterMap center={center} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location */}
        <CircleMarker
          center={center}
          radius={12}
          pathOptions={{
            color: "#ffffff",
            weight: 4,
            fillColor: "#d82035",
            fillOpacity: 1,
          }}
        >
          <Popup>
            <strong>Your Location</strong>
            <br />
            {userLocation.name || "Peshawar"}
          </Popup>
        </CircleMarker>

        {/* Donors */}
        {donors.map((donor) => {
          if (donor.latitude == null || donor.longitude == null) {
            return null;
          }

          return (
            <CircleMarker
              key={donor.id}
              center={[donor.latitude, donor.longitude]}
              radius={10}
              pathOptions={{
                color: "#ffffff",
                weight: 3,
                fillColor: isAvailable(donor)
                  ? "#c8172c"
                  : "#8d96a3",
                fillOpacity: 0.95,
              }}
            >
              <Popup>
                <div className="map-popup">
                  <strong>{donor.name}</strong>

                  <span>
                    Blood Group:{" "}
                    <b>{donor.blood_group}</b>
                  </span>

                  <span>
                    Distance:{" "}
                    {donor.distance != null
                      ? `${donor.distance} km`
                      : "Unknown"}
                  </span>

                  <span
                    className={
                      isAvailable(donor)
                        ? "popup-available"
                        : "popup-unavailable"
                    }
                  >
                    {isAvailable(donor)
                      ? "Available now"
                      : "Unavailable"}
                  </span>

                  {donor.phone && (
                    <a href={`tel:${donor.phone}`}>
                      Contact donor
                    </a>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className="map-overlay-label">
        <span className="map-dot"></span>
        Your location
      </div>
    </div>
  );
}

/* =========================================================
   DONOR CARD
========================================================= */

function DonorCard({ donor }) {
  return (
    <div className="donor-card">
      <div className="donor-avatar">
        {donor.initials || getInitials(donor.name)}
      </div>

      <div className="donor-info">
        <strong>{donor.name || "Blood Donor"}</strong>

        <span>
          {donor.blood_group || "Unknown"}{" "}
          •{" "}
          {donor.distance != null
            ? `${donor.distance} km away`
            : donor.location_name || "Peshawar"}
        </span>

        <small
          className={
            isAvailable(donor)
              ? "available"
              : "unavailable"
          }
        >
          {isAvailable(donor)
            ? "● Available now"
            : "● Currently unavailable"}
        </small>
      </div>

      <div className="blood-badge">
        {donor.blood_group || "—"}
      </div>

      <button
        className="contact-btn"
        onClick={() => {
          if (donor.phone) {
            window.location.href = `tel:${donor.phone}`;
          } else {
            alert("Phone number is not available.");
          }
        }}
      >
        Contact
      </button>
    </div>
  );
}

/* =========================================================
   HOME
========================================================= */

function Home({ donors, setPage, userLocation }) {
  const availableDonors = donors.filter(isAvailable);

  const nearbyDonors = [...donors]
    .filter(isAvailable)
    .sort((a, b) => {
      const distanceA = a.distance ?? 999;
      const distanceB = b.distance ?? 999;

      return distanceA - distanceB;
    })
    .slice(0, 4);

  return (
    <main className="main">
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">
            HEMO • BLOOD CONNECT
          </span>

          <h1>
            Find blood.
            <br />
            <span>Save a life.</span>
          </h1>

          <p>
            Connect with nearby blood donors and hospitals
            quickly when every second matters.
          </p>

          <div className="hero-buttons">
            <button
              className="primary-btn"
              onClick={() => setPage("request")}
            >
              Request Blood
            </button>

            <button
              className="secondary-btn"
              onClick={() => setPage("nearby")}
            >
              Find Donors
            </button>
          </div>
        </div>

        <div className="hero-side">
          <div className="hero-heart">♥</div>

          <div className="hero-location">
            <span>Current area</span>
            <strong>{userLocation.name || "Peshawar"}</strong>
          </div>
        </div>
      </section>

      <section className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon">♥</div>
          <div>
            <strong>{donors.length}</strong>
            <span>Registered Donors</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">✓</div>
          <div>
            <strong>{availableDonors.length}</strong>
            <span>Available Now</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">24</div>
          <div>
            <strong>24/7</strong>
            <span>Blood Support</span>
          </div>
        </div>
      </section>

      <section className="home-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">DONORS</span>
              <h2>Available nearby</h2>
              <p>Donors closest to your location</p>
            </div>

            <button
              className="text-btn"
              onClick={() => setPage("nearby")}
            >
              View all →
            </button>
          </div>

          <div className="donor-list">
            {nearbyDonors.length > 0 ? (
              nearbyDonors.map((donor) => (
                <DonorCard
                  key={donor.id}
                  donor={donor}
                />
              ))
            ) : (
              <div className="empty-state">
                <div>♥</div>
                <strong>No donors available</strong>
                <p>
                  There are currently no available donors.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="panel map-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">LIVE LOCATION</span>
              <h2>Nearby donor map</h2>
              <p>Tap a marker for donor details</p>
            </div>
          </div>

          <MapPreview
            donors={donors}
            userLocation={userLocation}
            height="390px"
          />
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   NEARBY
========================================================= */

function Nearby({
  donors,
  userLocation,
}) {
  const [bloodGroup, setBloodGroup] = useState("All");
  const [radius, setRadius] = useState("10");

  const filteredDonors = useMemo(() => {
    return donors
      .filter(isAvailable)
      .filter((donor) => {
        const bloodMatch =
          bloodGroup === "All" ||
          donor.blood_group === bloodGroup;

        const distance =
          donor.distance == null
            ? 999
            : Number(donor.distance);

        return (
          bloodMatch &&
          distance <= Number(radius)
        );
      })
      .sort(
        (a, b) =>
          (a.distance ?? 999) -
          (b.distance ?? 999)
      );
  }, [donors, bloodGroup, radius]);

  return (
    <main className="main">
      <div className="page-header">
        <span className="eyebrow">DONORS</span>

        <h1>Nearby Donors</h1>

        <p>
          Find available blood donors around your
          location.
        </p>
      </div>

      <section className="filter-bar">
        <div className="filter-group">
          <label>Blood Group</label>

          <select
            value={bloodGroup}
            onChange={(e) =>
              setBloodGroup(e.target.value)
            }
          >
            <option value="All">
              All blood groups
            </option>

            {BLOOD_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Search Radius</label>

          <select
            value={radius}
            onChange={(e) =>
              setRadius(e.target.value)
            }
          >
            <option value="5">Within 5 km</option>
            <option value="10">Within 10 km</option>
            <option value="20">Within 20 km</option>
          </select>
        </div>

        <div className="found-count">
          <strong>{filteredDonors.length}</strong>
          <span>available donors found</span>
        </div>
      </section>

      <section className="nearby-grid">
        <div className="panel nearby-map-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                LIVE MAP
              </span>
              <h2>Donor locations</h2>
            </div>
          </div>

          <MapPreview
            donors={filteredDonors}
            userLocation={userLocation}
            height="560px"
          />
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                AVAILABLE
              </span>

              <h2>
                {filteredDonors.length} donor
                {filteredDonors.length !== 1
                  ? "s"
                  : ""}
              </h2>
            </div>
          </div>

          <div className="donor-list">
            {filteredDonors.length > 0 ? (
              filteredDonors.map((donor) => (
                <DonorCard
                  key={donor.id}
                  donor={donor}
                />
              ))
            ) : (
              <div className="empty-state">
                <div>⌕</div>

                <strong>
                  No matching donors
                </strong>

                <p>
                  Try another blood group or increase
                  the search radius.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   REQUEST BLOOD
========================================================= */

function RequestBlood() {
  const [form, setForm] = useState({
    blood: "B+",
    units: "1",
    hospital: "Lady Reading Hospital",
    urgency: "Urgent",
    notes: "",
  });

  const [submitting, setSubmitting] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [requestId, setRequestId] =
    useState(null);

  const [error, setError] = useState("");

  const [matchingDonors, setMatchingDonors] = useState([]);
  const [matchingError, setMatchingError] = useState("");

  function updateField(field, value) {
    setForm((old) => ({
      ...old,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitting(true);
    setError("");

    const selectedHospital =
      HOSPITALS.find(
        (hospital) =>
          hospital.name === form.hospital
      ) || HOSPITALS[0];

    try {
      const response = await fetch(
        CREATE_REQUEST_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patient_id: 1,
            hospital_id: selectedHospital.id,
            blood_group: form.blood,
            units_needed: Number(form.units),
            priority: form.urgency,
            location_name:
              selectedHospital.name +
              ", Peshawar",
            latitude: selectedHospital.lat,
            longitude: selectedHospital.lng,
            notes: form.notes || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Blood request could not be submitted."
        );
      }

      setRequestId(data.request_id);
setMatchingDonors([]);
setMatchingError("");

try {
  const matchingResponse = await fetch(
    `${GET_MATCHING_DONORS_URL}?request_id=${data.request_id}`
  );

  const matchingData = await matchingResponse.json();

  if (!matchingResponse.ok || !matchingData.success) {
    throw new Error("Could not load matching donors.");
  }

  setMatchingDonors(
    matchingData.donors.map((donor) => ({
      ...donor,
      distance: donor.distance_km,
    }))
  );
} catch (matchingErr) {
  console.error(matchingErr);
  setMatchingError("Your request was submitted, but matching donors could not be loaded.");
}

setSubmitted(true);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Something went wrong. Make sure XAMPP Apache and MySQL are running."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="main">
        <div className="success-page">
          <div className="success-icon">✓</div>

          <span className="eyebrow">
            REQUEST CREATED
          </span>

          <h1>Blood request submitted!</h1>

          <p>
            Your request has been successfully saved
            in the HEMO database.
          </p>

          {requestId && (
            <div className="request-number">
              Request ID: #{requestId}
            </div>
          )}

          
<div className="matching-donors-section">
  <h2>Matching Blood Donors</h2>

  {matchingError && <p>{matchingError}</p>}

  {!matchingError && matchingDonors.length === 0 && (
    <p>No matching donors found for this request.</p>
  )}

  {matchingDonors.map((donor) => (
    <div className="donor-card" key={donor.id}>
      <h3>{donor.name}</h3>
      <p>Blood Group: {donor.blood_group}</p>
      <p>Location: {donor.location_name || "Peshawar"}</p>
      <p>Distance: {donor.distance} km</p>
      <p>Phone: {donor.phone}</p>

      {donor.phone && (
        <a href={`tel:${donor.phone}`}>
          Contact Donor
        </a>
      )}
    </div>
  ))}
</div>


          <button
            className="primary-btn"
            onClick={() => {
              setSubmitted(false);
              setRequestId(null);

              setForm({
                blood: "B+",
                units: "1",
                hospital:
                  "Lady Reading Hospital",
                urgency: "Urgent",
                notes: "",
              });
            }}
          >
            Create Another Request
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="main">
      <div className="page-header">
        <span className="eyebrow">
          EMERGENCY SUPPORT
        </span>

        <h1>Request Blood</h1>

        <p>
          Provide the required details and send your
          blood request.
        </p>
      </div>

      <div className="request-layout">
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-section-title">
              <span>01</span>
              <div>
                <strong>Blood requirement</strong>
                <p>
                  Tell us what type of blood you need.
                </p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Blood Group</label>

                <select
                  value={form.blood}
                  onChange={(e) =>
                    updateField(
                      "blood",
                      e.target.value
                    )
                  }
                >
                  {BLOOD_GROUPS.map((group) => (
                    <option
                      key={group}
                      value={group}
                    >
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Units Needed</label>

                <input
                  type="number"
                  min="1"
                  max="20"
                  value={form.units}
                  onChange={(e) =>
                    updateField(
                      "units",
                      e.target.value
                    )
                  }
                  required
                />
              </div>
            </div>

            <div className="form-section-title">
              <span>02</span>

              <div>
                <strong>Hospital details</strong>
                <p>
                  Where should the blood be delivered?
                </p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label>Hospital</label>

                <select
                  value={form.hospital}
                  onChange={(e) =>
                    updateField(
                      "hospital",
                      e.target.value
                    )
                  }
                >
                  {HOSPITALS.map((hospital) => (
                    <option
                      key={hospital.id}
                      value={hospital.name}
                    >
                      {hospital.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label>Urgency</label>

                <select
                  value={form.urgency}
                  onChange={(e) =>
                    updateField(
                      "urgency",
                      e.target.value
                    )
                  }
                >
                  <option>Normal</option>
                  <option>Urgent</option>
                  <option>Emergency</option>
                </select>
              </div>
            </div>

            <div className="form-section-title">
              <span>03</span>

              <div>
                <strong>Additional information</strong>
                <p>
                  Add anything donors should know.
                </p>
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>

              <textarea
                rows="5"
                placeholder="Enter additional information..."
                value={form.notes}
                onChange={(e) =>
                  updateField(
                    "notes",
                    e.target.value
                  )
                }
              />
            </div>

            {error && (
              <div className="error-box">
                <strong>Request failed</strong>
                <span>{error}</span>
              </div>
            )}

            <div className="location-callout">
              <div className="location-icon">
                📍
              </div>

              <div>
                <strong>
                  {form.hospital}
                </strong>

                <span>
                  Peshawar, Khyber Pakhtunkhwa
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="primary-btn submit-btn"
              disabled={submitting}
            >
              {submitting
                ? "Submitting request..."
                : "Submit Blood Request →"}
            </button>
          </form>
        </div>

        <aside className="request-side-card">
          <div className="side-heart">♥</div>

          <h2>Every request matters.</h2>

          <p>
            HEMO helps connect patients with nearby
            donors so that blood can be found faster.
          </p>

          <div className="side-feature">
            <span>✓</span>
            <div>
              <strong>Nearby donors</strong>
              <small>
                Find donors around your area.
              </small>
            </div>
          </div>

          <div className="side-feature">
            <span>✓</span>
            <div>
              <strong>Fast contact</strong>
              <small>
                Contact available donors directly.
              </small>
            </div>
          </div>

          <div className="side-feature">
            <span>✓</span>
            <div>
              <strong>Hospital based</strong>
              <small>
                Send requests to your selected
                hospital.
              </small>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

function Notifications() {
  const notifications = [
    {
      type: "success",
      icon: "✓",
      title: "Donor available nearby",
      text:
        "Ayesha Khan is available and matches B+ blood.",
      time: "Just now",
    },
    {
      type: "info",
      icon: "♥",
      title: "Request system active",
      text:
        "Your blood requests are saved securely in HEMO.",
      time: "Today",
    },
    {
      type: "warning",
      icon: "!",
      title: "Emergency support",
      text:
        "For urgent cases, use the Request Blood page.",
      time: "Today",
    },
  ];

  return (
    <main className="main">
      <div className="page-header">
        <span className="eyebrow">UPDATES</span>

        <h1>Notifications</h1>

        <p>
          Important updates related to your HEMO
          account.
        </p>
      </div>

      <div className="notifications-page">
        {notifications.map(
          (notification, index) => (
            <div
              className="notification"
              key={index}
            >
              <div
                className={`notification-icon ${notification.type}`}
              >
                {notification.icon}
              </div>

              <div className="notification-content">
                <strong>
                  {notification.title}
                </strong>

                <p>{notification.text}</p>

                <small>
                  {notification.time}
                </small>
              </div>

              <span className="notification-arrow">
                →
              </span>
            </div>
          )
        )}
      </div>
    </main>
  );
}

/* =========================================================
   PROFILE
========================================================= */


function Profile() {
  const [profile, setProfile] = useState({
    name: "Sara",
    role: "Patient",
    bloodGroup: "B+",
    location: "Peshawar",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);

  function handleEdit() {
    setFormData({ ...profile });
    setIsEditing(true);
  }

  function handleSave(event) {
    event.preventDefault();

    setProfile({ ...formData });
    setIsEditing(false);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  return (
    <main className="main">
      <div className="page-header">
        <span className="eyebrow">ACCOUNT</span>
        <h1>My Profile</h1>
        <p>Manage your HEMO account information.</p>
      </div>

      <section className="profile-layout">
        <div className="profile-card">
          <div className="profile-avatar">
            {profile.name.charAt(0).toUpperCase() || "S"}
          </div>

          <h2>{profile.name}</h2>

          <span className="profile-role">{profile.role}</span>

          <p className="profile-location">
            📍 {profile.location}, Pakistan
          </p>

          <button
            type="button"
            className="secondary-btn profile-edit"
            onClick={handleEdit}
          >
            Edit Profile
          </button>
        </div>

        <div className="panel profile-details">
          <div className="panel-header">
            <div>
              <span className="eyebrow">PERSONAL INFORMATION</span>
              <h2>{isEditing ? "Edit account details" : "Account details"}</h2>
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSave}>
              <div className="detail-row">
                <label htmlFor="profile-name">Full Name</label>
                <input
                  id="profile-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  maxLength={100}
                />
              </div>

              <div className="detail-row">
                <label htmlFor="profile-role">Role</label>
                <select
                  id="profile-role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="Patient">Patient</option>
                  <option value="Donor">Donor</option>
                </select>
              </div>

              <div className="detail-row">
                <label htmlFor="profile-blood">Blood Group</label>
                <select
                  id="profile-blood"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  required
                >
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                    (group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="detail-row">
                <label htmlFor="profile-location">Location</label>
                <input
                  id="profile-location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  maxLength={100}
                />
              </div>

              <div className="detail-row">
                <span>Account Status</span>
                <strong className="status-active">Active</strong>
              </div>

              <div className="profile-actions">
                <button type="submit" className="primary-btn">
                  Save Profile
                </button>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="detail-row">
                <span>Full Name</span>
                <strong>{profile.name}</strong>
              </div>

              <div className="detail-row">
                <span>Role</span>
                <strong>{profile.role}</strong>
              </div>

              <div className="detail-row">
                <span>Blood Group</span>
                <strong className="blood-text">{profile.bloodGroup}</strong>
              </div>

              <div className="detail-row">
                <span>Location</span>
                <strong>{profile.location}</strong>
              </div>

              <div className="detail-row">
                <span>Account Status</span>
                <strong className="status-active">Active</strong>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   MOBILE NAVIGATION
========================================================= */

function MobileNav({ page, setPage }) {
  const items = [
    ["home", "⌂", "Home"],
    ["nearby", "♥", "Donors"],
    ["request", "+", "Request"],
    ["notifications", "!", "Alerts"],
    ["profile", "S", "Profile"],
  ];

  return (
    <nav className="mobile-nav">
      {items.map(([key, icon, label]) => (
        <button
          key={key}
          className={
            page === key ? "active" : ""
          }
          onClick={() => setPage(key)}
        >
          <span>{icon}</span>
          {label}
        </button>
      ))}
    </nav>
  );
}

/* =========================================================
   MAIN APP
========================================================= */

function App() {
  const [page, setPage] = useState("home");

  const [donors, setDonors] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [apiError, setApiError] =
    useState("");

  const [userLocation, setUserLocation] =
    useState(DEFAULT_LOCATION);

  /* ---------------------------------------------
     LOAD DONORS
  --------------------------------------------- */

  useEffect(() => {
    async function loadDonors() {
      setLoading(true);
      setApiError("");

      try {
        const response = await fetch(
          GET_DONORS_URL
        );

        if (!response.ok) {
          throw new Error(
            `Server returned ${response.status}`
          );
        }

        const data = await response.json();

        const donorData = Array.isArray(data)
          ? data
          : data.donors ||
            data.data ||
            [];

        const formattedDonors =
          donorData.map((donor) => {
            const latitude =
              donor.latitude !== null &&
              donor.latitude !== undefined &&
              donor.latitude !== ""
                ? Number(donor.latitude)
                : null;

            const longitude =
              donor.longitude !== null &&
              donor.longitude !== undefined &&
              donor.longitude !== ""
                ? Number(donor.longitude)
                : null;

            let distance = null;

            if (
              latitude !== null &&
              longitude !== null &&
              !Number.isNaN(latitude) &&
              !Number.isNaN(longitude)
            ) {
              const calculated =
                calculateDistance(
                  DEFAULT_LOCATION.lat,
                  DEFAULT_LOCATION.lng,
                  latitude,
                  longitude
                );

              distance =
                calculated !== null
                  ? Number(
                      calculated.toFixed(1)
                    )
                  : null;
            }

            return {
              ...donor,
              id: donor.id,
              name:
                donor.name || "Blood Donor",
              phone: donor.phone || "",
              blood_group:
                donor.blood_group || "Unknown",
              latitude,
              longitude,
              location_name:
                donor.location_name ||
                "Peshawar",
              distance,
              available:
                isAvailable(donor),
              initials: getInitials(
                donor.name
              ),
            };
          });

        setDonors(formattedDonors);
      } catch (error) {
        console.error(
          "Donor API error:",
          error
        );

        setDonors([]);

        setApiError(
          "Could not connect to the HEMO donor database."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDonors();
  }, []);

  /* ---------------------------------------------
     OPTIONAL BROWSER LOCATION
  --------------------------------------------- */

  function useMyLocation() {
    if (!navigator.geolocation) {
      alert(
        "Geolocation is not supported by your browser."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat =
          position.coords.latitude;

        const lng =
          position.coords.longitude;

        setUserLocation({
          lat,
          lng,
          name: "Your current location",
        });
      },
      () => {
        alert(
          "Location permission was not available. HEMO is using the default Peshawar location."
        );
      }
    );
  }

  /* ---------------------------------------------
     PAGE
  --------------------------------------------- */

  function renderPage() {
    if (loading) {
      return (
        <main className="main">
          <div className="loading-page">
            <div className="loading-heart">
              ♥
            </div>

            <h2>Loading HEMO...</h2>

            <p>
              Connecting to nearby blood donors.
            </p>
          </div>
        </main>
      );
    }

    if (page === "nearby") {
      return (
        <Nearby
          donors={donors}
          userLocation={userLocation}
        />
      );
    }

    if (page === "request") {
      return <RequestBlood />;
    }

    if (page === "notifications") {
      return <Notifications />;
    }

    if (page === "profile") {
      return <Profile />;
    }

    return (
      <Home
        donors={donors}
        setPage={setPage}
        userLocation={userLocation}
      />
    );
  }

  return (
    <div className="app">
      <TopBar
        page={page}
        setPage={setPage}
      />

      {apiError && (
        <div className="api-warning">
          <span>{apiError}</span>

          <button
            onClick={() =>
              window.location.reload()
            }
          >
            Retry
          </button>
        </div>
      )}

      {renderPage()}

      <button
        className="location-button"
        onClick={useMyLocation}
        title="Use my current location"
      >
        📍 Use my location
      </button>

      <MobileNav
        page={page}
        setPage={setPage}
      />
    </div>
  );
}

export default App;
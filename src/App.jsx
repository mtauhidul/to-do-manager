import {
  AppBar,
  Box,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  FormControlLabel,
  Grid,
  IconButton,
  Radio,
  Snackbar,
  Toolbar,
  Typography,
} from "@mui/material";
import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  setDoc,
} from "firebase/firestore";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import "./App.css";
import ToDoManagerLogo from "./assets/logo.svg";
import PointsChart from "./PointsChart";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export function ToDoManagerHeader() {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Box sx={{ flexGrow: 1, marginBottom: 2 }}>
      <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={{ border: "1px solid #e2e8f0" }}
      >
        <Toolbar>
          <IconButton size="large" edge="start" sx={{ mr: 2 }}>
            <img
              src={ToDoManagerLogo}
              alt="ToDo Manager"
              style={{ height: 80, width: 80 }}
            />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: "bold" }}
          >
            {today}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontWeight: "medium",
              color: "#4a5568",
              display: { xs: "none", sm: "block" },
            }}
          >
            Welcome, <span style={{ color: "#4f46e5" }}>Tauhid</span>
          </Typography>
        </Toolbar>
      </AppBar>
    </Box>
  );
}

export function TaskCards({ tasks, handleDoneToggle, isChecked }) {
  return (
    <Grid container spacing={3}>
      {tasks.map((task) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={task.id}>
          <Card
            sx={{
              minWidth: 275,
              boxShadow: 3,
              borderRadius: 2,
              transition: "transform 0.2s",
              "&:hover": { transform: "scale(1.03)" },
              maxHeight: 200,
            }}
          >
            <CardContent>
              <Typography
                variant="h7"
                sx={{
                  fontWeight: "bold",
                  mb: 1,
                  color:
                    task.priority === "High"
                      ? "red"
                      : task.priority === "Med"
                      ? "orange"
                      : "green",
                }}
              >
                {task.name}
              </Typography>
              <Typography
                sx={{
                  color: "rgba(0, 0, 0, 0.7)",
                  display: "block",
                  background: "rgba(0, 0, 0, 0.1)",
                  borderRadius: 1,
                  fontSize: "0.875rem",
                  mb: 1,
                  mt: 1,
                }}
              >
                Deadline: {task.deadline}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mb: 1,
                  fontSize: "0.875rem",
                  color: "text.secondary",
                }}
              >
                {task.notes}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(0, 0, 0, 0.7)",
                  display: "block",
                  background: "rgba(0, 0, 0, 0.1)",
                  borderRadius: 1,
                  fontSize: "0.875rem",
                }}
              >
                <strong>Daily Hours:</strong> {task.dailyTimeDistribution} hrs
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: "center", mt: -2 }}>
              <FormControlLabel
                control={
                  <Radio
                    checked={isChecked(task.id)}
                    onChange={() =>
                      handleDoneToggle(task.id, task.points, task.name)
                    }
                    color="primary"
                    size="small"
                  />
                }
                label={<Typography variant="caption">Mark as Done</Typography>}
              />
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

TaskCards.propTypes = {
  tasks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      notes: PropTypes.string,
      deadline: PropTypes.string,
      priority: PropTypes.string,
      dailyTimeDistribution: PropTypes.number,
      points: PropTypes.number,
      done: PropTypes.bool.isRequired,
    })
  ).isRequired,
  handleDoneToggle: PropTypes.func.isRequired,
  isChecked: PropTypes.func.isRequired,
};

const App = () => {
  const [tasks, setTasks] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  const getTasks = async () => {
    setLoading(true);
    try {
      const taskList = [];
      const snapshot = await getDocs(collection(db, "tasks"));
      snapshot.forEach((doc) => taskList.push({ id: doc.id, ...doc.data() }));
      taskList.sort((a, b) => a.id - b.id);
      setTasks(taskList);
    } catch (error) {
      setSnackbar({ open: true, message: "Failed to fetch tasks" });
    } finally {
      setLoading(false);
    }
  };

  const getData = async () => {
    try {
      const dataList = [];
      const snapshot = await getDocs(collection(db, "data"));
      snapshot.forEach((doc) => dataList.push({ id: doc.id, ...doc.data() }));
      setData(dataList);
    } catch (error) {
      setSnackbar({ open: true, message: "Failed to fetch data" });
    }
  };

  const handleDoneToggle = async (id, points, name) => {
    try {
      const today = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      let updatedData = [...data];
      let todayDoc = updatedData.find((doc) => doc.date === today);

      if (!todayDoc) {
        todayDoc = { date: today, points: 0, entries: [] };
        updatedData.push(todayDoc);
      }

      const taskEntry = todayDoc.entries.find((entry) => entry.id === id);

      if (taskEntry) {
        taskEntry.done = !taskEntry.done;
        todayDoc.points += taskEntry.done ? points : -points;
      } else {
        todayDoc.entries.push({ id, done: true, points, name });
        todayDoc.points += points;
      }

      const todayDocRef = doc(db, "data", today.replace(/\s+/g, "_"));
      await setDoc(todayDocRef, todayDoc, { merge: true });

      setData(updatedData);

      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, done: !task.done } : task
        )
      );

      setSnackbar({
        open: true,
        message: `Task "${name}" updated successfully`,
      });
    } catch (error) {
      setSnackbar({ open: true, message: "Failed to update task" });
      console.error("Error updating task:", error);
    }
  };

  const isChecked = (id) => {
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const todayDoc = data.find((doc) => doc.date === today);
    return todayDoc?.entries.find((entry) => entry.id === id)?.done || false;
  };

  useEffect(() => {
    getTasks();
    getData();
  }, []);

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  return (
    <div className="App">
      <ToDoManagerHeader />
      <main className="p-5">
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TaskCards
              tasks={tasks}
              handleDoneToggle={handleDoneToggle}
              isChecked={isChecked}
            />
            <Box sx={{ mt: 5 }}>
              <Typography
                variant="h4"
                sx={{
                  textAlign: "center",
                  mb: 3,
                  fontWeight: "bold",
                  mt: 9,
                }}
              >
                Daily Points Performance
              </Typography>
              <PointsChart data={data} />
            </Box>
          </>
        )}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          message={snackbar.message}
        />
      </main>
    </div>
  );
};

export default App;

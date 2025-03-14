import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  Text,
  Card,
  Avatar,
  Button,
  Chip,
  Searchbar,
  Divider,
  useTheme,
  Portal,
  Modal,
  Title,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { db, useAuth, USER_TYPES } from "../context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "sonner-native";

const StudentListScreen = ({ navigation }) => {
  const { userProfile, trackEvent } = useAuth();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [jobPosition, setJobPosition] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    if (userProfile?.userType === USER_TYPES.PROFESSIONAL) {
      loadStudents();
    } else {
      // If not a professional, redirect to home
      navigation.replace("Home");
    }
  }, [userProfile]);

  const loadStudents = async () => {
    try {
      setIsLoading(true);

      // Query Firestore for users who are students
      const studentsQuery = query(
        collection(db, "users"),
        where("userType", "==", USER_TYPES.STUDENT),
        limit(50)
      );

      const querySnapshot = await getDocs(studentsQuery);
      const studentsData = [];

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        studentsData.push({
          id: doc.id,
          name: userData.displayName || "Student",
          email: userData.email || "",
          institution: userData.institution || "University",
          major: userData.major || "Not specified",
          graduationYear: userData.graduationYear || "Not specified",
          skills: userData.skills || [],
          photoURL:
            userData.photoURL ||
            `https://api.a0.dev/assets/image?text=indian%20student%20headshot&aspect=1:1&seed=${doc.id.substring(
              0,
              5
            )}`,
        });
      });

      setStudents(studentsData);
      setFilteredStudents(studentsData);
      trackEvent("viewed_students_list");
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("Failed to load students");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredStudents(students);
      return;
    }

    const lowerCaseQuery = query.toLowerCase();
    const filtered = students.filter(
      (student) =>
        student.name.toLowerCase().includes(lowerCaseQuery) ||
        student.institution.toLowerCase().includes(lowerCaseQuery) ||
        student.major.toLowerCase().includes(lowerCaseQuery) ||
        (student.skills &&
          student.skills.some((skill) =>
            skill.toLowerCase().includes(lowerCaseQuery)
          ))
    );

    setFilteredStudents(filtered);
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setShowReferralModal(true);
  };

  const handleSendReferral = async () => {
    debugger;
    if (!selectedStudent) return;

    if (!jobPosition.trim()) {
      toast.error("Job position is required");
      return;
    }

    if (!company.trim()) {
      toast.error("Company name is required");
      return;
    }

    // Add this check to ensure userProfile exists and has a uid
    if (!userProfile) {
      toast.error("User profile not loaded. Please try again.");
      return;
    }

    try {
      setIsProcessing(true);
      debugger;
      // Create a new referral offer document in Firestore
      const referralData = {
        professionalId: userProfile.uid || "fakeproffesinal id", // This was undefined before
        professionalName: userProfile.displayName || userProfile.email,
        professionalEmail: userProfile.email,
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        studentEmail: selectedStudent.email,
        jobPosition: jobPosition.trim(),
        company: company.trim(),
        message: message.trim(),
        status: "offered", // Initial status is 'offered'
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        type: "professional_initiated", // This identifies that a professional initiated this referral
      };

      // Add to the referralOffers collection
      const referralRef = await addDoc(
        collection(db, "referralOffers"),
        referralData
      );

      trackEvent("sent_referral_offer", {
        student_id: selectedStudent.id,
        job_position: jobPosition,
      });

      // Reset form and close modal
      setJobPosition("");
      setCompany("");
      setMessage("");
      setShowReferralModal(false);

      toast.success("Referral offer sent successfully");
    } catch (error) {
      console.error("Error sending referral offer:", error);
      toast.error("Failed to send referral offer");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStudentCard = ({ item }) => (
    <Card style={styles.card} onPress={() => handleSelectStudent(item)}>
      <Card.Content style={styles.cardContent}>
        <Avatar.Image
          source={{ uri: item.photoURL }}
          size={60}
          style={styles.avatar}
        />
        <View style={styles.studentInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.education}>
            {item.major} @ {item.institution}
          </Text>
          {item.graduationYear && (
            <Text style={styles.graduationYear}>
              Grad: {item.graduationYear}
            </Text>
          )}

          {item.skills && item.skills.length > 0 && (
            <View style={styles.skillsContainer}>
              {item.skills.slice(0, 3).map((skill, index) => (
                <Chip
                  key={index}
                  style={styles.skillChip}
                  textStyle={{ fontSize: 12 }}
                  compact
                >
                  {skill}
                </Chip>
              ))}
              {item.skills.length > 3 && (
                <Text style={styles.moreSkills}>
                  +{item.skills.length - 3} more
                </Text>
              )}
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={["right", "left", "top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Students</Text>
      </View>

      <Searchbar
        placeholder="Search by name, university, major, skills..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchbar}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      ) : (
        <>
          {filteredStudents.length > 0 ? (
            <FlatList
              data={filteredStudents}
              renderItem={renderStudentCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="users" size={60} color={theme.colors.outline} />
              <Text style={styles.emptyText}>No students found</Text>
              <Text style={styles.emptySubtext}>
                Try different search terms
              </Text>
              <Button
                mode="contained"
                onPress={loadStudents}
                style={styles.refreshButton}
              >
                Refresh List
              </Button>
            </View>
          )}
        </>
      )}

      {/* Referral Offer Modal */}
      <Portal>
        <Modal
          visible={showReferralModal}
          onDismiss={() => setShowReferralModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Title style={styles.modalTitle}>Offer Referral</Title>

            {selectedStudent && (
              <View style={styles.selectedStudentContainer}>
                <Avatar.Image
                  source={{ uri: selectedStudent.photoURL }}
                  size={50}
                  style={styles.modalAvatar}
                />
                <View style={styles.selectedStudentInfo}>
                  <Text style={styles.selectedStudentName}>
                    {selectedStudent.name}
                  </Text>
                  <Text style={styles.selectedStudentEducation}>
                    {selectedStudent.major} @ {selectedStudent.institution}
                  </Text>
                </View>
              </View>
            )}

            <Divider style={styles.divider} />

            <TextInput
              label="Job Position *"
              value={jobPosition}
              onChangeText={setJobPosition}
              mode="outlined"
              style={styles.modalInput}
              placeholder="e.g. Software Engineer, Data Scientist"
            />

            <TextInput
              label="Company *"
              value={company}
              onChangeText={setCompany}
              mode="outlined"
              style={styles.modalInput}
              placeholder="e.g. Google, Microsoft, Amazon"
            />

            <TextInput
              label="Message (Optional)"
              value={message}
              onChangeText={setMessage}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.modalInput}
              placeholder="Add details about the position or why you think this student would be a good fit..."
            />

            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowReferralModal(false)}
                style={styles.modalButton}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSendReferral}
                loading={isProcessing}
                style={[styles.modalButton, styles.sendButton]}
                disabled={
                  !jobPosition.trim() || !company.trim() || isProcessing
                }
              >
                Send Offer
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  searchbar: {
    marginHorizontal: 16,
    marginVertical: 12,
    elevation: 2,
    borderRadius: 8,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    marginRight: 16,
    backgroundColor: "#f0f4f8",
  },
  studentInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  education: {
    fontSize: 14,
    color: "#334e68",
    marginBottom: 2,
  },
  graduationYear: {
    fontSize: 12,
    color: "#627d98",
    marginBottom: 6,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  skillChip: {
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: "#e6f6ff",
  },
  moreSkills: {
    fontSize: 12,
    color: "#627d98",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: "#627d98",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "bold",
    color: "#334e68",
  },
  emptySubtext: {
    marginTop: 8,
    color: "#627d98",
    textAlign: "center",
    marginBottom: 20,
  },
  refreshButton: {
    borderRadius: 8,
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 24,
    margin: 20,
    borderRadius: 16,
  },
  modalContent: {
    width: "100%",
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: "center",
    color: "#0967d2",
  },
  selectedStudentContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  modalAvatar: {
    marginRight: 16,
    backgroundColor: "#f0f4f8",
  },
  selectedStudentInfo: {
    flex: 1,
  },
  selectedStudentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#334e68",
  },
  selectedStudentEducation: {
    fontSize: 14,
    color: "#627d98",
  },
  divider: {
    marginBottom: 16,
  },
  modalInput: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  sendButton: {
    marginLeft: 8,
  },
});

export default StudentListScreen;

import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Footer from '../../components/Footer';

export default function SupportHelpScreen() {
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const router = useRouter();

  const toggleQuestion = (index) => {
    if (expandedQuestion === index) {
      setExpandedQuestion(null);
    } else {
      setExpandedQuestion(index);
    }
  };

  const questions = [
    {
      question: "How to use Emergency Call?",
      answer: "Press and hold the red emergency button in home screen. All your guardians will receive notification."
    },
    {
      question: "How to add guardians?",
      answer: "Go to setting → Emergency Contact → Add new contact. Enter name and phone number."
    },
    {
      question: "How to View Health report?",
      answer: "Tap Reports tab at bottom → Choose 'View Report' → Select date range to view health data."
    },
    {
      question: "What do the Vitals mean?",
      answer: "Heart Rate: Shows heartbeat per minute. Blood pressure: Shows systolic and diastolic blood pressure as symbol/ diastolic. Both are percentage."
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support & Help</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Need Help Card with Gradient */}
       <LinearGradient
  colors={['#a4b2ecff', '#3d5dc6ff']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
  style={styles.needHelpCard}
>
  <View style={styles.needHelpContent}>
    <View style={styles.headsetIconContainer}>
      <Ionicons name="call" size={28} color="#fff" />
    </View>
    <View style={styles.needHelpText}>
      <Text style={styles.needHelpTitle}>Need Help?</Text>
      <Text style={styles.needHelpSubtitle}>We're here 24/7 for you</Text>
    </View>
  </View>
</LinearGradient>

        {/* Contact Us Section */}
        <Text style={styles.sectionTitle}>Contact Us</Text>

        <TouchableOpacity style={[styles.contactCard, { backgroundColor: '#c2e9e6ff' }]}>
          <View style={styles.contactLeft}>
            <View style={[styles.contactIcon, { backgroundColor: '#fff' }]}>
              <Ionicons name="call" size={22} color="#00897B" />
            </View>
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactTitle}>Customer Service</Text>
              <Text style={styles.contactValue}>+92 3334546816</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#00897B" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.contactCard, { backgroundColor: '#e8c9edff' }]}>
          <View style={styles.contactLeft}>
            <View style={[styles.contactIcon, { backgroundColor: '#fff' }]}>
              <Ionicons name="mail" size={22} color="#8E24AA" />
            </View>
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactTitle}>Email Support</Text>
              <Text style={styles.contactValue}>support@meditrack.com</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8E24AA" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.contactCard, { backgroundColor: '#fcd1c4ff' }]}>
          <View style={styles.contactLeft}>
            <View style={[styles.contactIcon, { backgroundColor: '#fff' }]}>
              <Ionicons name="alert-circle" size={22} color="#E64A19" />
            </View>
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactTitle}>Emergency Helpline</Text>
              <Text style={styles.contactValue}>1122 (24/7)</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#E64A19" />
        </TouchableOpacity>

        {/* Common Questions Section */}
        <Text style={styles.sectionTitle}>Common Question</Text>

        {questions.map((item, index) => (
          <View key={index} style={styles.questionCard}>
            <TouchableOpacity 
              style={styles.questionHeader}
              onPress={() => toggleQuestion(index)}
            >
              <View style={styles.questionIconContainer}>
                <Ionicons 
                  name={expandedQuestion === index ? "remove-circle" : "add-circle"} 
                  size={24} 
                  color="#333"
                />
              </View>
              <Text style={styles.questionText}>{item.question}</Text>
            </TouchableOpacity>
            
            {expandedQuestion === index && (
              <View style={styles.answerContainer}>
                <Text style={styles.answerText}>{item.answer}</Text>
              </View>
            )}
          </View>
        ))}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Footer Component */}
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  
  // Need Help Card with Gradient
  needHelpCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  needHelpContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headsetIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  needHelpText: {
    flex: 1,
  },
  needHelpTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  needHelpSubtitle: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.95,
    fontWeight: '400',
  },
  
  // Section Title
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 14,
    paddingLeft: 4,
  },
  
  // Contact Cards
  contactCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 12,
    color: '#616161',
    marginBottom: 3,
    fontWeight: '500',
  },
  contactValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  
  // Question Cards
  questionCard: {
    backgroundColor: '#E8E8E8',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  questionIconContainer: {
    marginRight: 10,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    lineHeight: 20,
  },
  answerContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 0,
  },
  answerText: {
    fontSize: 13,
    color: '#616161',
    lineHeight: 20,
    marginLeft: 34,
  },
});
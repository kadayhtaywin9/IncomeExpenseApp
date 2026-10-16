import * as SQLite from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const db = SQLite.openDatabaseSync('finance_app.db');

export default function App() {
  const [activeTab, setActiveTab] = useState('income');
  
  // Form Input States
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  // Data States
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // Edit Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState(''); 

  useEffect(() => {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS incomes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT,
        amount REAL,
        date TEXT
      );
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT,
        amount REAL,
        date TEXT
      );
    `);
    loadData();
  }, []);

  const loadData = () => {
    const incomeRows = db.getAllSync('SELECT * FROM incomes ORDER BY id DESC');
    const expenseRows = db.getAllSync('SELECT * FROM expenses ORDER BY id DESC');
    setIncomes(incomeRows);
    setExpenses(expenseRows);
  };

  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  const balance = totalIncome - totalExpense;

  const getCurrentDate = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const handleSave = () => {
    if (!description.trim() || !amount.trim()) {
      Alert.alert('အမှား', 'အကြောင်းအရာနှင့် ပမာဏကို အပြည့်အစုံ ဖြည့်ပါ။');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      Alert.alert('အမှား', 'ပမာဏသည် နံပါတ်ဖြစ်ရပါမည်။');
      return;
    }

    const dateStr = getCurrentDate();

    if (activeTab === 'income') {
      db.runSync('INSERT INTO incomes (description, amount, date) VALUES (?, ?, ?)', [description, numericAmount, dateStr]);
    } else {
      db.runSync('INSERT INTO expenses (description, amount, date) VALUES (?, ?, ?)', [description, numericAmount, dateStr]);
    }

    Alert.alert('အောင်မြင်သည်', 'သိမ်းတာအောင်မြင်ပါသည်');
    setDescription('');
    setAmount('');
    loadData();
  };

  const handleDelete = (id) => {
    Alert.alert('သတိပေးချက်', 'ဒီအချက်အလက်ကို ဖျက်မှာ သေချာပါသလား?', [
      { text: 'မလုပ်ပါ', style: 'cancel' },
      { 
        text: 'ဖျက်မည်', 
        style: 'destructive',
        onPress: () => {
          if (activeTab === 'income') {
            db.runSync('DELETE FROM incomes WHERE id = ?', [id]);
          } else {
            db.runSync('DELETE FROM expenses WHERE id = ?', [id]);
          }
          loadData();
        }
      }
    ]);
  };

  const handleDeleteAll = () => {
    const title = activeTab === 'income' ? 'ဝင်ငွေ မှတ်တမ်းအားလုံး' : 'ထွက်ငွေ မှတ်တမ်းအားလုံး';
    Alert.alert('သတိပေးချက်', `${title} ကို အကုန်ဖျက်မှာ သေချာပါသလား?`, [
      { text: 'မလုပ်ပါ', style: 'cancel' },
      { 
        text: 'အားလုံးဖျက်မည်', 
        style: 'destructive',
        onPress: () => {
          if (activeTab === 'income') {
            db.runSync('DELETE FROM incomes');
          } else {
            db.runSync('DELETE FROM expenses');
          }
          loadData();
        }
      }
    ]);
  };

  const openEditModal = (item) => {
    setEditId(item.id);
    setEditDescription(item.description);
    setEditAmount(item.amount.toString());
    setEditDate(item.date || getCurrentDate());
    setModalVisible(true);
  };

  const handleUpdate = () => {
    if (!editDescription.trim() || !editAmount.trim() || !editDate.trim()) {
      Alert.alert('အမှား', 'အချက်အလက်များ အားလုံး ဖြည့်ရန် လိုအပ်ပါသည်။');
      return;
    }

    const numericAmount = parseFloat(editAmount);
    if (isNaN(numericAmount)) {
      Alert.alert('အမှား', 'ပမာဏသည် နံပါတ်ဖြစ်ရပါမည်။');
      return;
    }

    if (activeTab === 'income') {
      db.runSync('UPDATE incomes SET description = ?, amount = ?, date = ? WHERE id = ?', [editDescription, numericAmount, editDate, editId]);
    } else {
      db.runSync('UPDATE expenses SET description = ?, amount = ?, date = ? WHERE id = ?', [editDescription, numericAmount, editDate, editId]);
    }

    setModalVisible(false);
    loadData();
    Alert.alert('အောင်မြင်သည်', 'ပြင်ဆင်ပြီးပါပြီ');
  };

  const currentData = activeTab === 'income' ? incomes : expenses;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.mainHeader}>ငွေစာရင်း ရှင်းတမ်း အက်ပ်</Text>

      {/* Page Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'income' && styles.activeIncomeTab]} 
          onPress={() => setActiveTab('income')}
        >
          <Text style={[styles.tabText, activeTab === 'income' && styles.activeTabText]}>ဝင်ငွေ (Income)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'expense' && styles.activeExpenseTab]} 
          onPress={() => setActiveTab('expense')}
        >
          <Text style={[styles.tabText, activeTab === 'expense' && styles.activeTabText]}>ထွက်ငွေ (Expense)</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>စုစုပေါင်း ဝင်ငွေ:</Text>
          <Text style={styles.incomeText}>{totalIncome.toLocaleString()} ကျပ်</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>စုစုပေါင်း ထွက်ငွေ:</Text>
          <Text style={styles.expenseText}>{totalExpense.toLocaleString()} ကျပ်</Text>
        </View>
        <View style={[styles.row, styles.borderTop]}>
          <Text style={styles.labelBold}>လက်ကျန်ငွေ (Balance):</Text>
          <Text style={[styles.balanceText, balance < 0 ? styles.redText : styles.greenText]}>
            {balance.toLocaleString()} ကျပ်
          </Text>
        </View>
      </View>

      {/* Form Section */}
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>
          {activeTab === 'income' ? 'ဝင်ငွေ အသစ်ထည့်ရန်' : 'ထွက်ငွေ အသစ်ထည့်ရန်'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="အကြောင်းအရာ"
          placeholderTextColor="#888"
          value={description}
          onChangeText={setDescription}
        />
        <TextInput
          style={styles.input}
          placeholder="ပမာဏ (ကျပ်)"
          placeholderTextColor="#888"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <TouchableOpacity 
          style={[styles.saveBtn, activeTab === 'income' ? styles.bgGreen : styles.bgRed]} 
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>သိမ်းမည်</Text>
        </TouchableOpacity>
      </View>

      {/* Table Section */}
      <View style={styles.tableContainer}>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.tableTitle}>
            {activeTab === 'income' ? 'ဝင်ငွေ မှတ်တမ်းဇယား' : 'ထွက်ငွေ မှတ်တမ်းဇယား'}
          </Text>
          {currentData.length > 0 && (
            <TouchableOpacity onPress={handleDeleteAll} style={styles.deleteAllBtn}>
              <Text style={styles.deleteAllText}>အားလုံးဖျက်မည်</Text>
            </TouchableOpacity>
          )}
        </View>

        {currentData.length === 0 ? (
          <Text style={styles.emptyText}>မှတ်တမ်း မရှိသေးပါ။</Text>
        ) : (
          currentData.map((item, index) => {
            const serialNumber = currentData.length - index;
            return (
              <View key={item.id} style={styles.tableRow}>
                {/* အပေါ်တန်း - နံပါတ်၊ အကြောင်းအရာ၊ ငွေကျပ် */}
                <View style={styles.rowTop}>
                  <Text style={styles.tdNo}>{serialNumber}.</Text>
                  <View style={styles.tdDescContainer}>
                    <Text style={styles.tdDesc}>{item.description}</Text>
                  </View>
                  <Text style={styles.tdAmount}>{item.amount.toLocaleString()} ကျပ်</Text>
                </View>

                {/* အောက်တန်း - Date ကို နှိပ်၍ ပြင်နိုင်ရန် TouchableOpacity ထည့်ထားပါသည် */}
                <View style={styles.rowBottom}>
                  <TouchableOpacity onPress={() => openEditModal(item)}>
                    <Text style={styles.tdDate}>📅 {item.date}</Text>
                  </TouchableOpacity>
                  <View style={styles.actionBtnContainer}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                      <Text style={styles.btnTextSmall}>ပြင်ရန်</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                      <Text style={styles.btnTextSmall}>ဖျက်ရန်</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Edit Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>အချက်အလက် ပြင်ဆင်ရန်</Text>
            <TextInput
              style={styles.input}
              placeholder="အကြောင်းအရာ"
              value={editDescription}
              onChangeText={setEditDescription}
            />
            <TextInput
              style={styles.input}
              placeholder="ပမာဏ"
              keyboardType="numeric"
              value={editAmount}
              onChangeText={setEditAmount}
            />
            <TextInput
              style={styles.input}
              placeholder="ရက်စွဲ (YYYY-MM-DD)"
              value={editDate}
              onChangeText={setEditDate}
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBtnText}>မလုပ်တော့ပါ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleUpdate}>
                <Text style={styles.modalBtnText}>သိမ်းမည်</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f0f2f5', padding: 15, paddingTop: 40 },
  mainHeader: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#333' },
  tabContainer: { flexDirection: 'row', marginBottom: 15, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#ccc' },
  tabButton: { flex: 1, paddingVertical: 12, backgroundColor: '#e0e0e0', alignItems: 'center' },
  activeIncomeTab: { backgroundColor: '#2e7d32' },
  activeExpenseTab: { backgroundColor: '#c62828' },
  tabText: { fontSize: 15, fontWeight: 'bold', color: '#555' },
  activeTabText: { color: '#fff' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  borderTop: { borderTopWidth: 1, borderTopColor: '#eee', marginTop: 6, paddingTop: 8 },
  label: { fontSize: 14, color: '#555' },
  labelBold: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  incomeText: { fontSize: 14, fontWeight: 'bold', color: '#2e7d32' },
  expenseText: { fontSize: 14, fontWeight: 'bold', color: '#c62828' },
  balanceText: { fontSize: 15, fontWeight: 'bold' },
  greenText: { color: '#2e7d32' },
  redText: { color: '#c62828' },
  formContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 3 },
  formTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  input: { backgroundColor: '#fafafa', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#ddd', marginBottom: 10, color: '#333' },
  saveBtn: { padding: 12, borderRadius: 6, alignItems: 'center' },
  bgGreen: { backgroundColor: '#2e7d32' },
  bgRed: { backgroundColor: '#c62828' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  tableContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 30, elevation: 3 },
  tableHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 2, borderBottomColor: '#ddd', paddingBottom: 6 },
  tableTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  deleteAllBtn: { backgroundColor: '#ffebee', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  deleteAllText: { color: '#c62828', fontSize: 12, fontWeight: 'bold' },
  tableRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  tdNo: { fontSize: 14, fontWeight: 'bold', color: '#666', width: 25 },
  tdDescContainer: { flex: 1, marginRight: 10 },
  tdDesc: { fontSize: 15, fontWeight: 'bold', color: '#333', flexWrap: 'wrap' },
  tdAmount: { fontSize: 15, fontWeight: 'bold', color: '#333', minWidth: 80, textAlign: 'right' },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 25 },
  tdDate: { fontSize: 13, fontWeight: '600', color: '#1976d2', textDecorationLine: 'underline' }, // နှိပ်လို့ရကြောင်း သိသာစေရန် အရောင်ပြောင်းထားသည်
  actionBtnContainer: { flexDirection: 'row' },
  editBtn: { backgroundColor: '#1976d2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4, marginRight: 6 },
  deleteBtn: { backgroundColor: '#d32f2f', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4 },
  btnTextSmall: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#888', marginVertical: 15, fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  modalCancelBtn: { backgroundColor: '#757575', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 5, marginRight: 10 },
  modalSaveBtn: { backgroundColor: '#2e7d32', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 5 },
  modalBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 }
});

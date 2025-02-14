// Config Sheet ID - thay thế bằng ID của Google Sheet bạn vừa tạo
const CONFIG_SHEET_ID = '1_AHnosp3iZB21fgvqGAH0nSjKjbaf3Wp1iqt4bcog_A';
const GITHUB_SECRET = 'generateRandomString';

// Thêm hàm doGet để xử lý GET requests
function doGet() {
  return ContentService.createTextOutput('App is running');
}

function doPost(e) {
  try {
    // Log toàn bộ request để debug
    console.log('Headers:', e.headers);
    console.log('Post data:', e.postData.contents);
    
    const payload = JSON.parse(e.postData.contents);
    console.log('Parsed payload:', payload);
    
    // Kiểm tra xem có commit không
    if (!payload.head_commit) {
      console.log('No head_commit found in payload');
      return ContentService.createTextOutput('No commit data').setMimeType(ContentService.MimeType.TEXT);
    }

    // Update Google Doc
    const doc = DocumentApp.openById('1Q7qikO2qplsSreFIt6GMvyphsj0kyyWE4t8pHs7fnRE');
    const body = doc.getBody();
    
    // Thêm thông tin commit
    body.appendParagraph('🔄 New Commit Details:')
        .setHeading(DocumentApp.ParagraphHeading.HEADING2);
    
    body.appendParagraph(`📦 Repository: ${payload.repository.name}`);
    body.appendParagraph(`👤 Author: ${payload.head_commit.author.name}`);
    body.appendParagraph(`💬 Message: ${payload.head_commit.message}`);
    body.appendParagraph(`🕒 Time: ${new Date(payload.head_commit.timestamp).toLocaleString()}`);
    body.appendParagraph(`📝 Modified files: ${payload.head_commit.modified.join(', ')}`);
    body.appendParagraph('-------------------');
    
    doc.saveAndClose();
    
    return ContentService.createTextOutput('Success').setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    console.error('Error:', error);
    return ContentService.createTextOutput('Error: ' + error.message).setMimeType(ContentService.MimeType.TEXT);
  }
}

function verifyWebhookSignature(signature, payload) {
  const computedSignature = 'sha1=' + Utilities.computeHmacSha1Signature(payload, GITHUB_SECRET)
    .map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
  return signature === computedSignature;
}

function updateDoc(doc, payload) {
  if (!doc) {
    throw new Error('Document not found');
  }
  
  try {
    const body = doc.getBody();
    
    // Thêm thông tin commit
    body.appendParagraph('🔄 New Commit Details:')
        .setHeading(DocumentApp.ParagraphHeading.HEADING2);
    
    body.appendParagraph(`📦 Repository: ${payload.repository.name}`);
    body.appendParagraph(`👤 Author: ${payload.pusher.name}`);
    body.appendParagraph(`💬 Message: ${payload.head_commit.message}`);
    body.appendParagraph(`⏰ Time: ${new Date().toLocaleString()}`);
    body.appendParagraph('-------------------');
    
    doc.saveAndClose();
  } catch (e) {
    console.error('Error updating doc:', e);
    throw e;
  }
}

function getRepoConfig(sheet, repoName) {
  const data = sheet.getDataRange().getValues();
  // Bỏ qua hàng header
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === repoName) {
      return {
        repoName: data[i][0],
        docId: data[i][1],
        owner: data[i][2]
      };
    }
  }
  return null;
}

// Hàm helper để setup repo mới
function setupNewRepo(repoName, docId, owner) {
  const configSheet = SpreadsheetApp.openById(CONFIG_SHEET_ID);
  const configs = configSheet.getSheetByName('Configurations');
  
  configs.appendRow([repoName, docId, owner]);
  
  // Khởi tạo document
  const doc = DocumentApp.openById(docId);
  const body = doc.getBody();
  
  body.appendParagraph('🚀 Git Commit History')
      .setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(`Repository: ${repoName}`)
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph('-------------------');
}

// Hàm để setup dữ liệu ban đầu
function setupInitialData() {
  const configSheet = SpreadsheetApp.openById(CONFIG_SHEET_ID);
  const configs = configSheet.getSheetByName('Configurations');
  
  // Xóa dữ liệu cũ
  configs.clear();
  
  // Thêm headers
  configs.getRange('A1:C1').setValues([['Repository Name', 'Google Doc ID', 'Owner']]);
  
  // Thêm dữ liệu cho repo
  setupNewRepo(
    'Flow_GGAPPSCRIPT',     // Tên repository của bạn
    '1Q7qikO2qplsSreFIt6GMvyphsj0kyyWE4t8pHs7fnRE', // ID của Google Doc bạn vừa tạo
    'Onamihoang'     // GitHub username của bạn
  );
}

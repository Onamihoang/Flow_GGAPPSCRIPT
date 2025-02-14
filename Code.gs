// Config Sheet ID - thay thế bằng ID của Google Sheet bạn vừa tạo
const CONFIG_SHEET_ID = '1_AHnosp3iZB21fgvqGAH0nSjKjbaf3Wp1iqt4bcog_A';
const GITHUB_SECRET = 'generateRandomString';

// Thêm hàm doGet để xử lý GET requests
function doGet() {
  return ContentService.createTextOutput('App is running');
}

function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  
  // Verify webhook signature
  if (!verifyWebhookSignature(e.headers['X-Hub-Signature'], e.postData.contents)) {
    return ContentService.createTextOutput('Invalid signature').setMimeType(ContentService.MimeType.TEXT);
  }
  
  try {
    // Đọc config từ repo
    const configUrl = `https://api.github.com/repos/${payload.repository.full_name}/contents/.github/docs-sync.yml`;
    const configResponse = UrlFetchApp.fetch(configUrl);
    const configData = JSON.parse(configResponse.getContentText());
    const config = YAML.parse(Utilities.newBlob(Utilities.base64Decode(configData.content)).getDataAsString());
    
    // Update Google Doc
    const doc = DocumentApp.openById(config.google_docs.doc_id);
    updateDoc(doc, payload);
    
    return ContentService.createTextOutput('Success').setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    console.error(error);
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

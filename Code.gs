// Config Sheet ID - thay thế bằng ID của Google Sheet bạn vừa tạo
const CONFIG_SHEET_ID = '1_AHnosp3iZB21fgvqGAH0nSjKjbaf3Wp1iqt4bcog_A';

// Thêm hàm doGet để xử lý GET requests
function doGet() {
  return ContentService.createTextOutput('App is running');
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Add logging
    Logger.log('Received webhook data:', data);
    
    // Lấy thông tin repo
    const repoName = data.repository.name;
    Logger.log('Repository name:', repoName);
    
    // Lấy cấu hình từ sheet
    const configSheet = SpreadsheetApp.openById(CONFIG_SHEET_ID);
    const configs = configSheet.getSheetByName('Configurations');
    const repoConfig = getRepoConfig(configs, repoName);
    Logger.log('Repo config:', repoConfig);
    
    if (!repoConfig) {
      Logger.log('No configuration found for repository:', repoName);
      return ContentService.createTextOutput(
        `No configuration found for repository: ${repoName}`
      );
    }
    
    // Cập nhật document
    const doc = DocumentApp.openById(repoConfig.docId);
    const body = doc.getBody();
    
    // Thêm thông tin commit
    body.appendParagraph('🔄 New Commit Details:')
        .setHeading(DocumentApp.ParagraphHeading.HEADING2);
    
    body.appendParagraph(`📦 Repository: ${repoName}`);
    body.appendParagraph(`👤 Author: ${data.pusher.name}`);
    body.appendParagraph(`💬 Message: ${data.head_commit.message}`);
    body.appendParagraph(`⏰ Time: ${new Date().toLocaleString()}`);
    body.appendParagraph('-------------------');
    
    // Lưu thay đổi
    doc.saveAndClose();
    
    return ContentService.createTextOutput('Success');
  } catch (error) {
    Logger.log('Error:', error);
    return ContentService.createTextOutput(`Error: ${error.toString()}`);
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
    'test-git-doc',     // Tên repository của bạn
    'YOUR_DOC_ID_HERE', // ID của Google Doc bạn vừa tạo
    'your-username'     // GitHub username của bạn
  );
}

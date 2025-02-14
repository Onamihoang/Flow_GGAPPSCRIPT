function doPost(e) {
  // ID của Google Doc cần cập nhật
  const DOC_ID = 'your_doc_id_here'; // Bạn sẽ thay đổi ID này sau
  
  try {
    // Lấy dữ liệu từ webhook
    const data = JSON.parse(e.postData.contents);
    
    // Mở document
    const doc = DocumentApp.openById(DOC_ID);
    const body = doc.getBody();
    
    // Thêm thông tin commit vào document
    body.appendParagraph('🔄 New Commit Details:')
        .setHeading(DocumentApp.ParagraphHeading.HEADING2);
    
    body.appendParagraph('👤 Author: ' + data.pusher.name);
    body.appendParagraph('💬 Message: ' + data.head_commit.message);
    body.appendParagraph('⏰ Time: ' + new Date().toLocaleString());
    body.appendParagraph('-------------------');
    
    // Lưu các thay đổi
    doc.saveAndClose();
    
    return ContentService.createTextOutput('Success');
  } catch (error) {
    return ContentService.createTextOutput('Error: ' + error.toString());
  }
}

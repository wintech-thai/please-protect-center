export const agentTranslations = {

  navbar: {
    EN: {
      fleetManagement: "Fleet Management",
      sensors: "Sensors",
      dashboard: "Dashboard", // เผื่อไว้ใช้ในอนาคต
    },
    TH: {
      fleetManagement: "จัดการฟลีท",
      sensors: "เซนเซอร์",
      dashboard: "แดชบอร์ด",
    }
  },
  
  sensors: {
    EN: {
      title: "Sensor Management",
      subHeader: "Manage your fleet sensors and view their activities.",
      searchPlaceholder: "Search by Code, Description...",
      columns: {
        code: "Code",
        description: "Description",
        tags: "Tags",
        createdDate: "Created Date",
        lastSeen: "Last Seen",
        action: "Action"
      },
      buttons: {
        add: "ADD",
        delete: "DELETE",
        overview: "Overview"
      },
      modal: {
        deleteTitle: "Delete Sensors",
        deleteMessage: "Are you sure you want to delete {count} sensor(s)? This action cannot be undone.",
      },
      toast: {
        fetchError: "Failed to load sensors",
        deleteSuccess: "Deleted successfully",
        deleteError: "Failed to delete sensors",
      },
      loading: "Loading sensors...",
      noData: "No sensors found."
    },
    TH: {
      title: "จัดการเซนเซอร์",
      subHeader: "จัดการรายการเซนเซอร์ในระบบและดูสถานะการทำงาน",
      searchPlaceholder: "ค้นหาด้วยรหัส, คำอธิบาย...",
      columns: {
        code: "รหัสเซนเซอร์",
        description: "คำอธิบาย",
        tags: "แท็ก",
        createdDate: "วันที่สร้าง",
        lastSeen: "พบล่าสุด",
        action: "จัดการ"
      },
      buttons: {
        add: "เพิ่ม",
        delete: "ลบ",
        overview: "ดูภาพรวม"
      },
      modal: {
        deleteTitle: "ลบเซนเซอร์",
        deleteMessage: "คุณแน่ใจหรือไม่ว่าต้องการลบเซนเซอร์จำนวน {count} รายการ? การดำเนินการนี้ไม่สามารถย้อนกลับได้",
      },
      toast: {
        fetchError: "ไม่สามารถโหลดข้อมูลเซนเซอร์ได้",
        deleteSuccess: "ลบข้อมูลสำเร็จ",
        deleteError: "เกิดข้อผิดพลาดในการลบเซนเซอร์",
      },
      loading: "กำลังโหลดข้อมูล...",
      noData: "ไม่พบข้อมูลเซนเซอร์"
    }
  },

  // --- หน้า Add (Register New Sensor) ---
  createSensor: {
    EN: {
      title: "Register New Sensor",
      subHeader: "Deploy a new agent to monitor your fleet.",
      infoTitle: "Sensor Information",
      labels: {
        code: "Sensor Code",
        description: "Description",
        tags: "Tags",
        url: "Registration URL",
        apiKey: "API Key"
      },
      placeholders: {
        code: "e.g. SENSOR-001",
        description: "e.g. DMZ Web Traffic Sensor",
        tags: "Type and press Enter to add tags..."
      },
      buttons: {
        cancel: "CANCEL",
        register: "SAVE",
        done: "DONE"
      },
      modal: {
        resultTitle: "Sensor Registered!",
        resultMessage: "Please save these credentials securely. For security reasons, the API Key will only be shown this one time.",
        exitTitle: "Unsaved Changes",
        exitMessage: "You have unsaved changes. Are you sure you want to leave this page?"
      },
      toast: {
        success: "Sensor registered successfully",
        error: "Failed to register sensor",
        copy: "Copied to clipboard!"
      }
    },
    TH: {
      title: "ลงทะเบียนเซนเซอร์ใหม่",
      subHeader: "ติดตั้งเอเจนต์ใหม่เพื่อเริ่มการมอนิเตอร์ระบบ",
      infoTitle: "ข้อมูลเซนเซอร์",
      labels: {
        code: "รหัสเซนเซอร์",
        description: "คำอธิบาย",
        tags: "แท็ก",
        url: "URL สำหรับลงทะเบียน",
        apiKey: "คีย์ API"
      },
      placeholders: {
        code: "เช่น SENSOR-001",
        description: "เช่น เซนเซอร์ตรวจสอบทราฟฟิก DMZ",
        tags: "พิมพ์แล้วกด Enter เพื่อเพิ่มแท็ก..."
      },
      buttons: {
        cancel: "ยกเลิก",
        register: "บันทึก",
        done: "เสร็จสิ้น"
      },
      modal: {
        resultTitle: "ลงทะเบียนสำเร็จ!",
        resultMessage: "โปรดเก็บรักษาข้อมูลเหล่านี้ไว้ให้ปลอดภัย เพื่อความปลอดภัย คีย์ API จะแสดงให้เห็นเพียงครั้งเดียวเท่านั้น",
        exitTitle: "ยังไม่ได้บันทึกข้อมูล",
        exitMessage: "คุณมีการแก้ไขที่ยังไม่ได้บันทึก ยืนยันที่จะออกจากหน้านี้หรือไม่?"
      },
      toast: {
        success: "ลงทะเบียนเซนเซอร์สำเร็จ",
        error: "ไม่สามารถลงทะเบียนเซนเซอร์ได้",
        copy: "คัดลอกลงคลิปบอร์ดแล้ว!"
      }
    }
  },

  // --- หน้า Update (Update Sensor) ---
  updateSensor: {
    EN: {
      title: "Update Sensor",
      subHeader: "Modify sensor identification and metadata.",
      infoTitle: "General Information",
      labels: {
        code: "Sensor Code",
        description: "Description",
        tags: "Tags"
      },
      buttons: {
        cancel: "CANCEL",
        save: "SAVE",
        stay: "STAY",
        leave: "LEAVE"
      },
      modal: {
        exitTitle: "Unsaved Changes",
        exitMessage: "You have modified the data. Are you sure you want to discard changes?"
      },
      toast: {
        loadError: "Failed to load sensor data",
        updateSuccess: "Sensor updated successfully",
        updateError: "Failed to update sensor"
      }
    },
    TH: {
      title: "แก้ไขข้อมูลเซนเซอร์",
      subHeader: "แก้ไขรหัสและข้อมูลรายละเอียดของเซนเซอร์",
      infoTitle: "ข้อมูลทั่วไป",
      labels: {
        code: "รหัสเซนเซอร์",
        description: "คำอธิบาย",
        tags: "แท็ก"
      },
      buttons: {
        cancel: "ยกเลิก",
        save: "บันทึก",
        stay: "อยู่ต่อ",
        leave: "ออกโดยไม่บันทึก"
      },
      modal: {
        exitTitle: "ยังไม่ได้บันทึกการเปลี่ยนแปลง",
        exitMessage: "คุณมีการแก้ไขข้อมูล ยืนยันที่จะละทิ้งการเปลี่ยนแปลงและออกจากหน้านี้หรือไม่?"
      },
      toast: {
        loadError: "ไม่สามารถโหลดข้อมูลเซนเซอร์ได้",
        updateSuccess: "อัปเดตข้อมูลเซนเซอร์สำเร็จ",
        updateError: "เกิดข้อผิดพลาดในการอัปเดตเซนเซอร์"
      }
    }
  }
};
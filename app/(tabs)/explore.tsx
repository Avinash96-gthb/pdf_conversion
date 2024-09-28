import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import mime from 'mime';
import { Platform } from 'react-native';

const UploadScreen = () => {
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  // Function to pick a file
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Allow all file types
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Set the selected file (DocumentPickerAsset)
        setSelectedFile(result.assets[0]);
      } else {
        console.log("File picking was canceled.");
        setSelectedFile(null); // Reset state if canceled
      }
    } catch (error) {
      console.error('Error picking file:', error);
      setSelectedFile(null); // Handle error by resetting state
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;
    let fileInfo;
    if (Platform.OS !== 'web') {
      fileInfo = await FileSystem.getInfoAsync(selectedFile.uri);
    } else {
      fileInfo = {
        uri: selectedFile.uri,
        name: selectedFile.name || 'unknown_file',
      };
    }

    const fileExtension = selectedFile.name.split('.').pop() || ''; // Get file extension
    const mimeType = mime.getType(fileExtension) || 'application/octet-stream'; // Get MIME type based on file extension

    const file = {
      uri: Platform.OS === 'android' ? selectedFile.uri : selectedFile.uri.replace('file://', ''),
      name: selectedFile.name || 'unknown_file',
      type: mimeType,
    };

    const formData = new FormData();
        formData.append("file", {
          uri: file.uri,
          type: file.type,
          name: file.name,
        } as any);
        const fileContent = ''
        formData.append("file_data", fileContent);

        //addLog(`FormData created`);
  
        // Send request to server
        //addLog("Sending request to server...");
        try{
          const response = await fetch("http://192.168.1.6:8000/convert-to-pdf", {
            method: "POST",
            body: formData,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } catch (error)
        {
          console.log('Error uploading file:', error);
        }

        
  
        //addLog(`Response received: ${response.status}`);
  
        // if (!response.ok) {
        //   const errorText = await response.text();
        //   throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        // }
        // const blob = await response.blob();
        // const filePath = `${FileSystem.documentDirectory}converted_file.pdf`;
        // await FileSystem.writeAsStringAsync(filePath, await blobToBase64(blob), {
        //   encoding: FileSystem.EncodingType.Base64,
        // });
        

    // if (file.type.startsWith('image/')) {
    //   // File is an image
    //   const response = await fetch(file.uri);
    //   const blob = await response.blob();

    //   const { data, error } = await supabase.storage
    //     .from('your_bucket_name')
    //     .upload(`images/${file.name}`, blob);

    //   if (error) {
    //     console.error('Error uploading image:', error.message);
    //   } else {
    //     console.log('Image uploaded successfully:', data);
    //     // You can now save the URL to your database or perform other operations
    //   }
    // } else if (file.type === 'application/pdf') {
    //   // File is a PDF
    //   const { data, error } = await supabase.storage
    //     .from('your_bucket_name')
    //     .upload(`documents/${file.name}`, file);

    //   if (error) {
    //     console.error('Error uploading PDF file:', error.message);
    //   } else {
    //     console.log('PDF file uploaded successfully:', data);
    //     // You can now save the URL to your database or perform other operations
    //   }
    // } else {
    //   console.error('Unsupported file type:', file.type);
    // }
  };

  const dimension = Dimensions.get("window");
  const Width = dimension.width;
  const Height = dimension.height;

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' }}>
      {selectedFile && <Text>{selectedFile.name}</Text>}

      <TouchableOpacity
        style={{ flexDirection: 'row',marginTop: '10%', width: '90%',height: 52, alignItems: 'center', justifyContent: 'center', alignContent: 'center', backgroundColor: '#007BFF', padding: 10, borderRadius: 15, marginBottom: 20 }}
        onPress={pickFile}
      >
        <MaterialCommunityIcons name="file-document" size={24} color="white" style={{ marginRight: 10 }} />
        <Text style={{ color: 'white' }}>Choose File</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ flexDirection: 'row',width: '90%', height: 52, alignItems: 'center', justifyContent: 'center', alignContent: 'center', backgroundColor: '#5cb85c', padding: 10, borderRadius: 15 }}
        onPress={uploadFile}
      >
        <MaterialCommunityIcons name="upload" size={24} color="white" style={{ marginRight: 10 }} />
        <Text style={{ color: 'white' }}>Upload File</Text>
      </TouchableOpacity>
    </View>
  );
};

export default UploadScreen;
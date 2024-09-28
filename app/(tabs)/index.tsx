import React, { useState } from "react";
import { Button, View, Alert, StyleSheet, Text } from "react-native";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

interface FileType {
  uri: string;
  name: string;
  mimeType: string;
}

export default function App() {
  const [file, setFile] = useState<FileType | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLog(prevLog => [...prevLog, message]);
  };

  const pickDocument = async (): Promise<void> => {
    try {
      addLog("Picking document...");
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
      addLog(`Document picker result: ${JSON.stringify(result)}`);
      
      if (result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        let fileUri = selectedFile.uri;
        let fileName = selectedFile.name;
        let fileMimeType = selectedFile.mimeType || "application/octet-stream";
  
        addLog(`Initial file info: URI: ${fileUri}, Name: ${fileName}, MIME: ${fileMimeType}`);
  
        // Check if the URI is a data URI
        if (fileUri.startsWith('data:')) {
          addLog("Detected data URI. Processing...");
          // Extract the MIME type from the data URI
          const mimeMatch = fileUri.match(/^data:([^;]+);/);
          if (mimeMatch) {
            fileMimeType = mimeMatch[1];
            addLog(`Extracted MIME type from data URI: ${fileMimeType}`);
          }
  
          // Generate a temporary file name if not provided
          if (!fileName) {
            const extension = fileMimeType.split('/')[1] || 'unknown';
            fileName = `file-${Date.now()}.${extension}`;
            addLog(`Generated file name: ${fileName}`);
          }
  
          // Save the data URI content to a temporary file
          const tempFilePath = `${FileSystem.cacheDirectory}${fileName}`;
          addLog(`Saving data URI to temporary file: ${tempFilePath}`);
          await FileSystem.writeAsStringAsync(tempFilePath, fileUri.split(',')[1], {
            encoding: FileSystem.EncodingType.Base64,
          });
          fileUri = tempFilePath;
          addLog(`Saved to temporary file. New URI: ${fileUri}`);
        }
  
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        addLog(`File info after processing: ${JSON.stringify(fileInfo)}`);
        
        setFile({
          uri: fileInfo.uri,
          name: fileName,
          mimeType: fileMimeType,
        });
        
        addLog(`Final selected file: ${JSON.stringify({
          uri: fileInfo.uri,
          name: fileName,
          mimeType: fileMimeType,
        })}`);
      } else {
        addLog("User canceled document picker or no file selected.");
      }
    } catch (err) {
      addLog(`Error picking document: ${err}`);
    }
  };

  const handleFileUpload = async (): Promise<void> => {
    if (file) {
      addLog(`Preparing to upload file: ${file.name}`);
  
      try {
        // Read the file content as a base64 string
        const fileContent = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
        
        // Create FormData object
        const formData = new FormData();
        formData.append("file", {
          uri: file.uri,
          type: file.mimeType,
          name: file.name,
        } as any);
        formData.append("file_data", fileContent);
  
        addLog(`FormData created`);
  
        // Send request to server
        addLog("Sending request to server...");
        const response = await fetch("http://YOUR_LOCAL_IP:8000/convert-to-pdf", {
          method: "POST",
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
  
        addLog(`Response received: ${response.status}`);
  
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
  
        // Handle the response
        const blob = await response.blob();
        addLog(`Blob received: ${blob.size} bytes`);
  
        // Save the received PDF
        const filePath = `${FileSystem.documentDirectory}converted_file.pdf`;
        await FileSystem.writeAsStringAsync(filePath, await blobToBase64(blob), {
          encoding: FileSystem.EncodingType.Base64,
        });
  
        addLog(`File saved to: ${filePath}`);
        Alert.alert("Success", `PDF file saved to: ${filePath}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        addLog(`Error in POST request: ${errorMessage}`);
        Alert.alert("Error", `Failed to upload file: ${errorMessage}`);
      }
    } else {
      addLog("No file selected");
      Alert.alert("Error", "Please select a file first");
    }
  };

  
  
  // Helper function to convert base64 to Blob
  const b64toBlob = (b64Data: string, contentType: string = '', sliceSize: number = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
  
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
  
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
  
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
  
    const blob = new Blob(byteArrays, {type: contentType});
    return blob;
  };
  
  // Helper function to convert Blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  return (
    <View style={styles.container}>
      <Button title="Pick Document" onPress={pickDocument} />
      <Button title="Convert and Download PDF" onPress={handleFileUpload} />
      <Text style={styles.fileInfo}>
        {file ? `Selected file: ${file.name}` : 'No file selected'}
      </Text>
      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>Log:</Text>
        {log.map((entry, index) => (
          <Text key={index} style={styles.logEntry}>{entry}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fileInfo: {
    marginTop: 20,
    marginBottom: 20,
  },
  logContainer: {
    marginTop: 20,
    width: '100%',
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
  },
  logTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  logEntry: {
    fontSize: 12,
    marginBottom: 2,
  },
});
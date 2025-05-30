import React, { useState, useRef, useEffect } from 'react'
import { PaperAirplaneIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { sendMessage as sendApiMessage } from '../lib/api' 
import { useAuth } from '../context/AuthContext' 

// handles input for messages and files
const ChatInput = ({ chatId, onTextMessageSend }) => { 
    const { user: currentUser } = useAuth()

    const [messageContent, setMessageContent] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)
    const [filePreview, setFilePreview] = useState(null)
    const fileInputRef = useRef(null)
    const [sending, setSending] = useState(false)

    const handleSendMessage = async (e) => {
        e.preventDefault()

        // check for empty message or missing chat
        if ((!messageContent.trim() && !selectedFile) || !chatId) return

        const token = localStorage.getItem('token')
        if (!token) {
            console.error('authentication token not found')
            return
        }

        setSending(true)
        try {
            if (selectedFile) {
                // send file through api
                await sendApiMessage(chatId, messageContent.trim(), token, selectedFile)
            } else if (onTextMessageSend) {
                // emit message through socket
                await onTextMessageSend(chatId, messageContent.trim())
            }

            // reset inputs after sending
            setMessageContent('')
            setSelectedFile(null)
            setFilePreview(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
        } catch (error) {
            console.error('error sending message', error)
        } finally {
            setSending(false)
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (!file) return

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm', 'video/avi']
        const maxSize = 50 * 1024 * 1024

        if (!allowedTypes.includes(file.type)) {
            alert('only images and videos are allowed')
            resetFileInput()
            return
        }

        if (file.size > maxSize) {
            alert('file size must be 50 mb or less')
            resetFileInput()
            return
        }

        setSelectedFile(file)
        setFilePreview(URL.createObjectURL(file))
    }

    const resetFileInput = () => {
        setSelectedFile(null)
        setFilePreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleRemoveFile = () => {
        resetFileInput()
    }

    return (
        <form onSubmit={handleSendMessage} className="p-4 bg-gray-800 border-t border-gray-700 flex flex-col">
            {filePreview && (
                <div className="relative mb-2 p-2 border border-gray-600 rounded bg-gray-700 flex items-center justify-center max-w-xs">
                    {selectedFile?.type.startsWith('image/') && (
                        <img src={filePreview} alt="Preview" className="max-h-32 object-contain rounded" />
                    )}
                    {selectedFile?.type.startsWith('video/') && (
                        <video src={filePreview} controls className="max-h-32 object-contain rounded" />
                    )}
                    <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 z-10"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className="flex items-center space-x-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*,video/*,.gif"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="p-2 text-gray-400 hover:text-blue-400"
                    title="Attach File"
                >
                    <PaperClipIcon className="h-6 w-6" />
                </button>
                <input
                    type="text"
                    className="flex-grow p-3 rounded-full bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type a message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    disabled={sending}
                />
                <button
                    type="submit"
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={sending || (!messageContent.trim() && !selectedFile)}
                >
                    <PaperAirplaneIcon className="h-6 w-6 transform rotate-65 -mt-0.5" />
                </button>
            </div>
        </form>
    )
}

export default ChatInput

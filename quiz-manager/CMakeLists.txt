cmake_minimum_required(VERSION 3.5)

project(quiz-manager LANGUAGES CXX)

set(CMAKE_INCLUDE_CURRENT_DIR ON)

set(CMAKE_AUTOUIC ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# QtCreator supports the following variables for Android, which are identical to qmake Android variables.
# Check http://doc.qt.io/qt-5/deployment-android.html for more information.
# They need to be set before the find_package(Qt5 ...) call.

#if(ANDROID)
#    set(ANDROID_PACKAGE_SOURCE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/android")
#    if (ANDROID_ABI STREQUAL "armeabi-v7a")
#        set(ANDROID_EXTRA_LIBS
#            ${CMAKE_CURRENT_SOURCE_DIR}/path/to/libcrypto.so
#            ${CMAKE_CURRENT_SOURCE_DIR}/path/to/libssl.so)
#    endif()
#endif()

find_package(Qt5 COMPONENTS Widgets REQUIRED)

if(ANDROID)
  add_library(quiz-manager SHARED
    main.cpp
    mainwindow.cpp
    mainwindow.h
    mainwindow.ui
    imageviewer.cpp
    imageviewer.h
  )
else()
  add_executable(quiz-manager
    main.cpp
    mainwindow.cpp
    mainwindow.h
    mainwindow.ui
    imageviewer.cpp
    imageviewer.h
  )
endif()

target_link_libraries(quiz-manager PRIVATE Qt5::Widgets)

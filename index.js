import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import {
    NativeModules,
    PanResponder,
    Dimensions,
    Image,
    View,
    Animated,
} from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

const CustomCrop = (props, ref) => {

    const polygon = useRef();

    const [containerWidth, setContainerWidth] = useState(props.containerWidth ? props.containerWidth : Dimensions.get('window').width)

    const [width, setWidth] = useState(props.width);
    const [height, setHeight] = useState(props.height)
    const [viewHeight, setViewHeight] = useState(containerWidth * (props.height / props.width));

    const [image, setImage] = useState(props.initialImage)


    const imageCoordinatesToViewCoordinates = (corner) => {
        return {
            x: (corner.x * containerWidth) / width,
            y: (corner.y * viewHeight) / height,
        };
    }


    const [overlayPositions, setOverlayPositions] = useState('0,0,0,0')

    const topLeft = useRef(new Animated.ValueXY(
        props.rectangleCoordinates
            ? imageCoordinatesToViewCoordinates(
                  props.rectangleCoordinates.topLeft,
              )
            : { x: 100, y: 100 },
    )).current;

    const topRight = useRef(new Animated.ValueXY(
        props.rectangleCoordinates
            ? imageCoordinatesToViewCoordinates(
                  props.rectangleCoordinates.topRight,
              )
            : { x: containerWidth - 100, y: 100 },
    )).current;

    const bottomLeft = useRef(new Animated.ValueXY(
        props.rectangleCoordinates
            ? imageCoordinatesToViewCoordinates(
                  props.rectangleCoordinates.bottomLeft,
              )
            : { x: 100, y: viewHeight - 100 },
    )).current;

    const bottomRight = useRef(new Animated.ValueXY(
        props.rectangleCoordinates
            ? imageCoordinatesToViewCoordinates(
                  props.rectangleCoordinates.bottomRight,
              )
            : {
                  x: containerWidth - 100,
                  y: viewHeight - 100,
              },
    )).current;

    useEffect(() => {
        setWidth(props.width);
        setHeight(props.height);

        setContainerWidth(props.containerWidth ? props.containerWidth : Dimensions.get('window').width);

        setViewHeight(containerWidth * (props.height / props.width));

        setImage(props.initialImage);
        
    }, [props.width, props.height, props.containerWidth, props.initialImage])

    useEffect(() => {
        topLeft.setValue(
            props.rectangleCoordinates
                ? imageCoordinatesToViewCoordinates(
                        props.rectangleCoordinates.topLeft
                    )
                : { x: 100, y: 100 },
        )
        topRight.setValue(
            props.rectangleCoordinates
                ? imageCoordinatesToViewCoordinates(
                        props.rectangleCoordinates.topRight,
                    )
                : { x: containerWidth - 100, y: 100 },
        )
        bottomLeft.setValue(
            props.rectangleCoordinates
                ? imageCoordinatesToViewCoordinates(
                    props.rectangleCoordinates.bottomLeft,
                )
                : { x: 100, y: viewHeight - 100 },
        )
        bottomRight.setValue(
            props.rectangleCoordinates
                ? imageCoordinatesToViewCoordinates(
                        props.rectangleCoordinates.bottomRight,
                    )
                : {
                        x: containerWidth - 100,
                        y: viewHeight - 100,
                },
        )

        updateOverlayString();
        
    }, [props.rectangleCoordinates, containerWidth, viewHeight])


    useEffect(() => {
        setOverlayPositions(`${topLeft.x._value},${
                topLeft.y._value
            } ${topRight.x._value},${topRight.y._value} ${
                bottomRight.x._value
            },${bottomRight.y._value} ${
                bottomLeft.x._value
            },${bottomLeft.y._value}`);

    }, [topLeft, topRight, bottomRight, bottomLeft])



    const createPanResponser = (corner) => {
        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: Animated.event([
                null,
                {
                    dx: corner.x,
                    dy: corner.y,
                },
            ], { useNativeDriver: false }),
            onPanResponderRelease: () => {
                corner.flattenOffset();
                updateOverlayString();
            },
            onPanResponderGrant: () => {
                corner.setOffset({ x: corner.x._value, y: corner.y._value });
                corner.setValue({ x: 0, y: 0 });
            },
        });
    }


    const panResponderTopLeft = useRef(createPanResponser(
        topLeft
    )).current;
    const panResponderTopRight = useRef(createPanResponser(
        topRight,
    )).current;
    const panResponderBottomLeft = useRef(createPanResponser(
        bottomLeft,
    )).current;
    const panResponderBottomRight = useRef(createPanResponser(
        bottomRight,
    )).current;


    const updateOverlayString = () => {
        setOverlayPositions(`${topLeft.x._value},${
            topLeft.y._value
        } ${topRight.x._value},${topRight.y._value} ${
            bottomRight.x._value
        },${bottomRight.y._value} ${
            bottomLeft.x._value
        },${bottomLeft.y._value}`);
    }



    useImperativeHandle(ref, () => ({
        crop
    }))


    const crop = () => {
        const coordinates = {
            topLeft: viewCoordinatesToImageCoordinates(topLeft),
            topRight: viewCoordinatesToImageCoordinates(
                topRight,
            ),
            bottomLeft: viewCoordinatesToImageCoordinates(
                bottomLeft,
            ),
            bottomRight: viewCoordinatesToImageCoordinates(
                bottomRight,
            ),
            height: height,
            width: width,
        };
        NativeModules.CustomCropManager.crop(
            coordinates,
            image,
            (err, res) => props.updateImage(res.image, coordinates),
        );
    }

    const viewCoordinatesToImageCoordinates = (corner) => {
        return {
            x:
                (corner.x._value / containerWidth) *
                width,
            y: (corner.y._value / viewHeight) * height,
        };
    }

    return (
        <View
            style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'flex-end',
            }}
        >
            <View
                style={[
                    s(props).cropContainer,
                    { height: viewHeight },
                ]}
            >
                <Image
                    style={[
                        s(props).image,
                        { height: viewHeight },
                    ]}
                    resizeMode="contain"
                    source={{ uri: image }}
                />
                <Svg
                    height={viewHeight}
                    width={containerWidth}
                    style={{ position: 'absolute', left: 0, top: 0 }}
                >
                    <AnimatedPolygon
                        ref={polygon}
                        fill={props.overlayColor || 'blue'}
                        fillOpacity={props.overlayOpacity || 0.5}
                        stroke={props.overlayStrokeColor || 'blue'}
                        points={overlayPositions}
                        strokeWidth={props.overlayStrokeWidth || 3}
                    />
                </Svg>
                <Animated.View
                    {...panResponderTopLeft.panHandlers}
                    style={[
                        topLeft.getLayout(),
                        s(props).handler,
                    ]}
                >
                    <View
                        style={[
                            s(props).handlerI,
                            { left: -10, top: -10 },
                        ]}
                    />
                    <View
                        style={[
                            s(props).handlerRound,
                            { left: 31, top: 31 },
                        ]}
                    />
                </Animated.View>
                <Animated.View
                    {...panResponderTopRight.panHandlers}
                    style={[
                        topRight.getLayout(),
                        s(props).handler,
                    ]}
                >
                    <View
                        style={[
                            s(props).handlerI,
                            { left: 10, top: -10 },
                        ]}
                    />
                    <View
                        style={[
                            s(props).handlerRound,
                            { right: 31, top: 31 },
                        ]}
                    />
                </Animated.View>
                <Animated.View
                    {...panResponderBottomLeft.panHandlers}
                    style={[
                        bottomLeft.getLayout(),
                        s(props).handler,
                    ]}
                >
                    <View
                        style={[
                            s(props).handlerI,
                            { left: -10, top: 10 },
                        ]}
                    />
                    <View
                        style={[
                            s(props).handlerRound,
                            { left: 31, bottom: 31 },
                        ]}
                    />
                </Animated.View>
                <Animated.View
                    {...panResponderBottomRight.panHandlers}
                    style={[
                        bottomRight.getLayout(),
                        s(props).handler,
                    ]}
                >
                    <View
                        style={[
                            s(props).handlerI,
                            { left: 10, top: 10 },
                        ]}
                    />
                    <View
                        style={[
                            s(props).handlerRound,
                            { right: 31, bottom: 31 },
                        ]}
                    />
                </Animated.View>
            </View>
        </View>
    );

}


const s = (props) => ({
    handlerI: {
        borderRadius: 0,
        height: 20,
        width: 20,
        backgroundColor: props.handlerColor || 'blue',
    },
    handlerRound: {
        width: 39,
        position: 'absolute',
        height: 39,
        borderRadius: 100,
        backgroundColor: props.handlerColor || 'blue',
    },
    image: {
        width: props.containerWidth ? props.containerWidth : Dimensions.get('window').width,
        position: 'absolute',
    },
    bottomButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'blue',
        width: 70,
        height: 70,
        borderRadius: 100,
    },
    handler: {
        height: 140,
        width: 140,
        overflow: 'visible',
        marginLeft: -70,
        marginTop: -70,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
    },
    cropContainer: {
        position: 'absolute',
        left: 0,
        width: props.containerWidth ? props.containerWidth : Dimensions.get('window').width,
        top: 0,
    },
});

export default forwardRef(CustomCrop);

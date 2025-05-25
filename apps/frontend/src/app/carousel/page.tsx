import ReactCarousel, { AFTER, CENTER, BEFORE } from "react-carousel-animated";
import "react-carousel-animated/dist/style.css";

<ReactCarousel
    carouselConfig={{
        transform: {
            rotateY: {
                [BEFORE]: () => "rotateY(25deg)",
                [CENTER]: () => "rotateY(0deg)",
                [AFTER]: () => "rotateY(-25deg)",
            },
        },
    }}
    itemBackgroundStyle={{
        backgroundColor: "#ece4db",
        borderRadius: "3px",
        boxShadow: "8px 12px 14px -6px black",
    }}
    containerBackgroundStyle={{
        filter: "blur(7px)",
        backgroundColor: "rgba(62, 212, 214, 0.3)",
    }}
    carouselHeight="600px"
>
    {images.map((image, index) => (
        <img
            key={index}
            src={image.src}
            alt="test"
            style={{
                height: "500px",
                borderRadius: "20px",
                boxShadow: "0 7px 20px 2px rgb(150, 170, 180)",
                margin: "1rem",
            }}
        />
    ))}
</ReactCarousel>;
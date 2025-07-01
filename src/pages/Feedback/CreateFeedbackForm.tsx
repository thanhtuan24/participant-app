import { Button, Divider } from "@components";
import { participantDate } from "@constants";
import { useStore } from "@store";
import React, {  useState } from "react";
import styled from "styled-components";
import tw from "twin.macro";
import { Box, Icon } from "zmp-ui";
import { useForm } from "react-hook-form";
import { registerDate } from "@service/services";
import SelectFeedbackType from "./SelectFeedbackType";

export interface IUploadImageResponse {
    domain: string;
    images: string[];
}

export interface FormItemValidate {
    status: "default" | "error";
    errorText?: string;
}

export interface FormValidate {
    title: FormItemValidate;
    content: FormItemValidate;
}

const Conainer = styled(Box)`
    ${tw`bg-white`}
`;

const SendButton = styled(Button)`
    ${tw`w-full mt-6`}
`;


export interface CreateFeedbackFormProps {
    successCallback?: (status?: boolean) => void;
}
const CreateFeedbackForm: React.FC<CreateFeedbackFormProps> = ({
    successCallback,
}) => {
    const [loading,user] = useStore(state => [
        state.creatingFeedback,
        state.user
    ]);


    const [type, setType] = useState<number>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        handleSubmit,
    } = useForm({ mode: "onChange" });

    const onSubmit = async () => {
        setIsSubmitting(true);
        try {
            console.log("Xac nhan");
            console.log("Type:",type);
        const newUser = {
        userID: user?.id||"12345",
        username: user?.name||"demo",
        avatar: user?.avatar||"",
        participantDate: participantDate(),
        status: (type===1 || type===undefined)?'yes':'no'
        };
        const successStatus = await registerDate(newUser); 
            successCallback?.(successStatus);       
        console.log("Thanh cong");
        } catch (err) {
            setError({
                message: "Có lỗi xảy ra, vui lòng thử lại sau!",
            });
        } finally {
            setIsSubmitting(false); // Set isSubmitting to false after submitting
        }
    };

    const handleFeedbackTypeChange = id => {
        setType(id);
    };

    const setError = useStore(state => state.setError);


    return (
        <Conainer p={4} m={0}>
            <form onSubmit={handleSubmit(onSubmit)}>
                
                <SelectFeedbackType
                        value={type}
                        onChange={handleFeedbackTypeChange}
                    />

                <Box my={4}>
                    <Divider />
                </Box>

                {user ? (
                 <SendButton
                 loading={loading} disabled={isSubmitting}
                 htmlType="submit"
                 suffixIcon={<Icon icon="zi-chevron-right" />}
             >
                 Xác nhận
             </SendButton>
            ) : ( <div/>
            )}
            </form>
        </Conainer>
    );
};

export default CreateFeedbackForm;
